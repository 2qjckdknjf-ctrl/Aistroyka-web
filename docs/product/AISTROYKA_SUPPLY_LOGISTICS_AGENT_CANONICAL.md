# AISTROYKA Supply & Logistics Agent — Canonical Product Memory

**Status:** Canonical source of truth for future implementation
**Date:** 2026-08-27
**Purpose:** This document preserves the product intent and implementation context so Cursor/agents can recover the complete design from short user requests such as “реализуй блок поставки материалов”, “сделай закупки”, “подключи поставщиков”, “добавь склад”, or “сделай логистику материалов”.

## 1. Product intent

AISTROYKA must evolve from construction management software into an AI-operated construction operations platform. Procurement, warehouse inventory, supplier connectivity and delivery logistics are a first-class domain, not a small materials form.

The target user experience is conversational and action-oriented.

Example:

> Manager: “Нужно 200 листов гипсокартона на объект завтра.”
>
> AISTROYKA AI checks the project/site inventory, the company warehouse, connected supplier inventories and prices, delivery options and available company/external vehicles. It returns a concrete proposal such as: “200 листов есть у Supplier X. Материал €1,780, доставка €95. Машина свободна завтра 13:00–15:00, ETA на объект 14:00. Подтвердить заказ?”
>
> Only after required approval does AISTROYKA place the order/book transport, track it and confirm receipt.

## 2. Core principle

The system optimizes the entire fulfilment result, not merely the cheapest product.

Optimization inputs include:

- material match / specification suitability;
- project/site stock;
- company warehouse stock;
- supplier inventory;
- material price;
- delivery price;
- warehouse distance;
- lead time;
- required-by date/time;
- supplier reliability;
- transport capacity;
- own-fleet availability;
- supplier delivery availability;
- external carrier availability;
- project urgency and schedule impact.

The goal is: **find the best reliable way to get the correct material to the correct project at the required time and total landed cost.**

## 3. Required new domain

Create a first-class domain named conceptually:

`Procurement & Logistics`

It must include:

1. Supplier Connector Platform
2. Normalized Material Catalog
3. Company Warehouse / Site Inventory
4. Procurement Engine
5. Logistics / Delivery Engine
6. Fleet & Driver Availability
7. Purchase Orders
8. Shipment Tracking
9. Goods Receipt
10. Material Consumption / Reorder
11. AI Supply & Logistics Agent tools
12. Approval / governance / audit

## 4. Supplier Connector Platform

AISTROYKA should be able to connect external supplier and warehouse systems through multiple integration methods, in priority order:

1. direct supplier API;
2. ERP/WMS integration;
3. EDI;
4. structured CSV/XML/Excel feeds;
5. supplier portal / partner connector;
6. email/PDF ingestion as a degraded fallback where automation is impossible.

Normalized supplier data should include at minimum:

- supplier;
- supplier warehouse;
- supplier product/SKU;
- manufacturer;
- normalized material identity;
- unit of measure;
- current available quantity;
- current price and VAT treatment;
- minimum order / pack size;
- warehouse location;
- lead time;
- delivery zones;
- delivery methods;
- delivery slots where supported;
- data freshness timestamp;
- source/provenance.

## 5. Material Catalog and equivalence

Do not rely on free-text product names alone.

AISTROYKA needs an internal normalized material taxonomy so products from different suppliers can map to a common construction material identity.

Example:

`plasterboard.standard.12_5mm`

Possible supplier equivalents:

- Knauf BA13 / supplier SKU A;
- Placo BA13 / supplier SKU B;
- Siniat 12.5 mm / supplier SKU C.

The equivalence layer must preserve technical constraints and confidence. AI may recommend substitutes but must not silently replace a material where specification, certification, dimensions, fire rating, acoustic rating or project requirement differs.

## 6. Inventory priority logic

When material is requested, source search order should generally be:

1. project/site inventory;
2. company-owned warehouse inventory;
3. nearby connected supplier inventory;
4. alternate connected suppliers;
5. fallback sourcing flow.

If company stock exists, the system should prefer internal transfer when this is cheaper/faster and policy permits.

Example:

> “На собственном складе Barcelona есть 72 мешка. Покупать не нужно. Свободная машина компании может забрать 50 завтра в 09:00 и доставить на объект ориентировочно в 10:15.”

## 7. Procurement Engine

The procurement engine should perform deterministic calculations around AI reasoning.

Expected capabilities:

- resolve requested material into normalized catalog item(s);
- find approved equivalents;
- query inventories;
- compare supplier offers;
- calculate total landed cost;
- enforce minimum pack/order quantities;
- split orders only when justified;
- score supplier reliability;
- consider project-required date/time;
- create purchase requests;
- create purchase-order proposals;
- obtain human approval according to policy;
- place order through connector when approved;
- track supplier confirmation and exceptions.

LLM should not directly mutate supplier systems or database tables. It proposes typed tool calls; AISTROYKA backend validates permission/policy and performs execution.

## 8. Logistics Engine

After sourcing, AISTROYKA must solve delivery.

Inputs:

- pickup warehouse;
- destination project/site;
- cargo lines;
- weight/volume/dimensions where known;
- handling constraints;
- required delivery date/time;
- access restrictions at project;
- unloading requirements.

Delivery source priority can be company-configurable but should support:

1. own company fleet;
2. supplier-provided delivery;
3. preferred contracted carriers;
4. connected transport marketplaces / external carriers.

The system should compare options and return a concrete slot/ETA, not only a vague “tomorrow”.

Example result:

- Carrier A: 3.5T, 12:00–14:00, €95;
- Carrier B: 7.5T, 09:00–11:00, €135;
- Supplier delivery: 14:00–16:00, €120.

## 9. Fleet and driver model

Support internal logistics assets:

- vehicles;
- vehicle type/capacity;
- current availability;
- driver assignments;
- driver working hours;
- vehicle calendar;
- maintenance/unavailable states;
- depot/base location.

The system should avoid booking an external carrier if an approved internal vehicle can fulfill the job better under company policy.

## 10. Order and shipment lifecycle

Canonical flow:

`REQUESTED -> SOURCING -> PROPOSED -> APPROVAL_REQUIRED -> APPROVED -> ORDERED -> SUPPLIER_CONFIRMED -> PICKING -> READY_FOR_PICKUP -> DRIVER_ASSIGNED -> IN_TRANSIT -> ARRIVED -> RECEIVED -> CLOSED`

Exception states should include at least:

- partially confirmed;
- supplier shortage;
- substitute proposed;
- delivery delayed;
- transport unavailable;
- damaged goods;
- short delivery;
- rejected receipt;
- cancelled.

The AI agent should proactively recover from exceptions when possible.

Example:

> “Поставщик отменил 20 мешков. Нашёл замену у Supplier B. ETA остаётся до 15:00, стоимость увеличится на €34. Подтвердить замену?”

## 11. Goods Receipt

Worker/manager mobile apps should support arrival confirmation.

Possible receipt workflow:

- identify shipment/PO;
- record arrival time;
- capture photos;
- record received quantity;
- record shortages;
- record damaged quantity;
- record notes;
- optionally use vision AI to assist product recognition / approximate count / package damage detection;
- close or open discrepancy workflow.

Example:

- ordered: 100;
- received: 98;
- damaged: 2.

## 12. Proactive material planning

Long-term target: AISTROYKA should predict shortages before a manager asks.

Inputs may include:

- project schedule;
- quantities/BOM/estimate;
- current progress;
- daily reports;
- actual material consumption;
- project/site stock;
- warehouse stock;
- supplier lead times.

Example:

> “Через 5 дней начинается плитка второго этажа. По плановому объёму потребуется 36 мешков клея. На объекте осталось 22. Дефицит 14. Supplier A имеет 90 в наличии. Если заказать до 16:00 сегодня, доставка возможна завтра 11:00. Создать заявку?”

## 13. AI tool registry — initial supply/logistics tools

Suggested typed tools:

### Read/search

- `search_material`
- `find_equivalent_materials`
- `get_project_inventory`
- `get_company_warehouse_inventory`
- `check_supplier_inventory`
- `compare_supplier_prices`
- `get_supplier_delivery_options`
- `get_company_vehicle_availability`
- `find_carriers`
- `get_delivery_slots`
- `quote_delivery`
- `track_purchase_order`
- `track_shipment`

### Planning/calculation

- `calculate_material_requirement`
- `calculate_landed_cost`
- `rank_fulfilment_options`
- `build_purchase_proposal`

### Write/action

- `create_purchase_request`
- `create_purchase_order_draft`
- `request_purchase_approval`
- `place_purchase_order`
- `reserve_company_vehicle`
- `book_delivery`
- `reschedule_delivery`
- `confirm_goods_receipt`
- `report_shortage`
- `report_damage`
- `create_supplier_exception`

All write/action tools must be narrow, typed, policy-checked, idempotent and audited.

## 14. Governance and approvals

Never allow the LLM to access `service_role`, execute arbitrary SQL, or call arbitrary supplier endpoints.

Execution chain:

`LLM/Planner -> Action Proposal -> Tool Registry -> Authorization/Policy -> Approval if required -> Domain Service -> Connector -> Audit`

Financial actions should be governed by configurable thresholds, role and tenant policy.

Example:

- read availability: automatic;
- create purchase-request draft: automatic/low risk;
- place order under configured manager threshold: optional policy;
- higher-value order: explicit manager/owner approval;
- payment/bank changes: human-only/highest control tier.

Each action should record provenance, evidence, requester, approver, exact supplier quote, delivery quote and resulting external identifiers.

## 15. Suggested data model

Likely entities (final schema must follow existing repository conventions and a pre-implementation audit):

- `suppliers`
- `supplier_connections`
- `supplier_warehouses`
- `supplier_products`
- `supplier_inventory`
- `supplier_prices`
- `materials`
- `material_equivalents`
- `project_material_requirements`
- `project_inventory`
- `company_warehouses`
- `warehouse_inventory`
- `purchase_requests`
- `purchase_request_items`
- `purchase_orders`
- `purchase_order_items`
- `carriers`
- `vehicles`
- `drivers`
- `shipments`
- `shipment_stops`
- `delivery_slots`
- `goods_receipts`
- `goods_receipt_items`
- `material_consumption`
- `supplier_exceptions`

## 16. Core orchestration flow

Canonical flow for a material request:

```text
Material requested
      ↓
Check project/site inventory
      ↓ insufficient
Check company warehouse
      ↓ insufficient
Search connected suppliers
      ↓
Normalize / validate equivalent products
      ↓
Calculate best sourcing options
      ↓
Check own vehicle availability
      ↓ if unavailable / worse option
Check supplier delivery
      ↓ if unavailable / worse option
Check external carriers
      ↓
Calculate total landed cost + ETA + risk
      ↓
Present proposal
      ↓
Approval gate
      ↓
Order + transport booking
      ↓
Track supplier + shipment
      ↓
Receive on site
      ↓
Update inventory / discrepancy / consumption
```

## 17. Integration with AISTROYKA Agent Runtime

This domain is intended to plug into the broader AISTROYKA Agent Runtime architecture, not create an isolated AI subsystem.

It should reuse:

- Agent Gateway / authenticated session;
- Context Engine;
- Tool Registry;
- provider abstraction/router;
- AI policy/governance;
- action proposals;
- approvals;
- idempotent execution;
- audit / telemetry;
- memory/evidence;
- Manager Agent and Worker Agent surfaces.

Voice is only another interface. The business logic remains in the same Supply & Logistics tools and domain services.

## 18. User-facing scenarios that must remain preserved

### Scenario A — manager orders material

> “Нужно 200 листов гипсокартона завтра.”

System checks stock/suppliers/transport and gives a price + slot + ETA, then requests approval and executes.

### Scenario B — company warehouse avoids purchase

> “Нужно 50 мешков клея.”

System identifies internal stock and offers internal transfer with company vehicle instead of buying.

### Scenario C — proactive shortage prediction

System predicts shortage from schedule/progress/consumption and proposes ordering before work is blocked.

### Scenario D — delivery exception

Supplier shortage or carrier delay triggers automatic re-sourcing/re-routing proposal while protecting ETA and budget.

### Scenario E — site receipt

Worker receives shipment, photos it, records quantity/damage, and AISTROYKA reconciles PO/shipment/site inventory.

## 19. Cursor retrieval aliases / keywords

When the user later gives a short implementation request, treat the following as references to this canonical specification:

- “реализуй блок поставки материалов”
- “реализуй материалы”
- “сделай закупки”
- “закупка материалов”
- “поставщики”
- “подключи базы поставщиков”
- “подключи склад поставщика”
- “наш склад”
- “учёт склада”
- “логистика материалов”
- “доставка материалов”
- “найди машину на доставку”
- “Procurement & Logistics”
- “Supply & Logistics Agent”
- “Supplier Connector”
- “Material Procurement Agent”

Before implementation, Cursor/agent must read this document, inspect current AISTROYKA code and canonical architecture, identify existing overlapping domain models, and implement incrementally without creating duplicate AI/provider/governance stacks.

## 20. Implementation rule

Do not jump directly to live supplier ordering.

Recommended sequence:

1. audit current material/estimate/inventory-related code;
2. define canonical contracts and normalized material model;
3. build company/site inventory foundation;
4. build Supplier Connector interface + mock/reference connector;
5. implement read-only sourcing/comparison;
6. add purchase proposals and approval workflow;
7. add internal fleet/logistics availability;
8. add transport connector abstraction;
9. add controlled write/order execution;
10. add shipment tracking and goods receipt;
11. add proactive shortage prediction;
12. only then enable broader agent autonomy.

All stages require tests, RBAC/tenant isolation, auditability, evidence/provenance and feature-flagged rollout.
