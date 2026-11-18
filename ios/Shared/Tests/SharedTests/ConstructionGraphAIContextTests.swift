import XCTest
@testable import Shared

final class ConstructionGraphAIContextTests: XCTestCase {
    func testDecodesAIContextEnvelope() throws {
        let data = Data("""
        {"data":{
          "project_id":"p1",
          "tenant_id":"t1",
          "truncated":false,
          "summary":{"node_count":2,"edge_count":1,"families":{"project":1,"task":1}},
          "nodes":[{
            "id":"projects:p1",
            "family":"project",
            "label":"Villa",
            "source":{"table":"projects","id":"p1"},
            "provenance":{"kind":"sot_row","table":"projects","id":"p1"}
          }],
          "edges":[{
            "id":"e1",
            "kind":"contains",
            "from_id":"projects:p1",
            "to_id":"worker_tasks:t1",
            "provenance":{"kind":"sot_fk","table":"worker_tasks","column":"project_id"}
          }],
          "disclaimer":"overlay_refs_only_not_contractual_truth"
        }}
        """.utf8)
        let ctx = try ConstructionGraphAIContext.decodeEnvelopeJSON(data)
        XCTAssertEqual(ctx.projectId, "p1")
        XCTAssertEqual(ctx.summary.nodeCount, 2)
        XCTAssertEqual(ctx.nodes[0].source.table, "projects")
        XCTAssertEqual(ctx.disclaimer, "overlay_refs_only_not_contractual_truth")
        XCTAssertFalse(Mirror(reflecting: ctx).children.contains { $0.label == "budget" })
    }
}
