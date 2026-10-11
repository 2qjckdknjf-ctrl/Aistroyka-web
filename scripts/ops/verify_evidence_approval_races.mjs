/** Native PostgreSQL two-session checks; invoked from the isolated DB harness. */
import assert from 'node:assert/strict';
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
export async function verifyEvidenceApprovalRaces({writer,reviewer,observer,id}) {
  const passes=[];
  async function blocked(client) {
    const pid=(await client.query('select pg_backend_pid() as pid')).rows[0].pid;
    return pid;
  }
  const writerPid=await blocked(writer), reviewerPid=await blocked(reviewer);
  async function waitLock(pid) {
    const end=Date.now()+5000;
    while(Date.now()<end){const r=await observer.query('select wait_event_type from pg_stat_activity where pid=$1',[pid]);if(r.rows[0]?.wait_event_type==='Lock')return;await delay(20)}
    assert.fail('Expected the report row lock to block the other session');
  }
  async function beginWorker() {
    await writer.query('begin');await writer.query('set local role authenticated');
    await writer.query("select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claim.role','authenticated',true)",[id(7)]);
  }
  const insert=(client,e,r)=>client.query('insert into visual_evidence_records(id,tenant_id,project_id,report_id,media_id,uploader_user_id) values($1,$2,$3,$4,$5,$6)',[id(e),id(201),id(301),id(r),id(411),id(7)]);
  try {
    await observer.query('insert into media values($1,$2,$3)',[id(411),id(201),id(301)]);
    for(const r of [611,612,613]){
      await observer.query("insert into worker_reports values($1,$2,$3,null,$4,'submitted')",[id(r),id(201),id(501),id(7)]);
      await observer.query('insert into worker_report_media values($1,$2,null)',[id(r),id(411)]);
    }
    await beginWorker();await insert(writer,851,611);
    await reviewer.query('begin');
    const approval=reviewer.query("update worker_reports set status='approved' where id=$1",[id(611)]);
    await waitLock(reviewerPid);await writer.query('commit');await approval;await reviewer.query('commit');
    assert.equal((await observer.query('select count(*)::int as n from visual_evidence_records where id=$1',[id(851)])).rows[0].n,1);
    passes.push('source commits before blocked approval');

    await reviewer.query('begin');await reviewer.query("update worker_reports set status='approved' where id=$1",[id(612)]);
    await beginWorker();const lateInsert=insert(writer,852,612).then(()=>null,e=>e);
    await waitLock(writerPid);await reviewer.query('commit');assert.equal((await lateInsert)?.code,'23514');await writer.query('rollback');
    assert.equal((await observer.query('select count(*)::int as n from visual_evidence_records where id=$1',[id(852)])).rows[0].n,0);
    passes.push('approval commits before blocked insert; insert denied');

    await beginWorker();await insert(writer,853,613);await writer.query('commit');
    await reviewer.query('begin');await reviewer.query("update worker_reports set status='approved' where id=$1",[id(613)]);
    await beginWorker();const lateEdit=writer.query("update visual_evidence_records set zone_label='After review' where id=$1",[id(853)]).then(()=>null,e=>e);
    await waitLock(writerPid);await reviewer.query('commit');assert.equal((await lateEdit)?.code,'23514');await writer.query('rollback');
    assert.equal((await observer.query('select zone_label from visual_evidence_records where id=$1',[id(853)])).rows[0].zone_label,null);
    passes.push('approval commits before blocked source edit; edit denied');
    for(const name of passes)console.log('PASS native race:',name);
    return passes;
  } finally {
    await writer.query('rollback');await reviewer.query('rollback');
  }
}
