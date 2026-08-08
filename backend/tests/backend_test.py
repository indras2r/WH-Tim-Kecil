"""EventGudang backend regression tests"""
import os
import io
import pytest
import requests

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/") if os.environ.get("REACT_APP_BACKEND_URL") else "https://stock-tracker-2199.preview.emergentagent.com"
API = BASE_URL + "/api"

ADMIN_EMAIL = "indra.suhardiman@gmail.com"
ADMIN_PASS = "Admin123!"
STAFF_EMAIL = "staff@eventgudang.com"
STAFF_PASS = "Staff123!"


# -------- fixtures --------
@pytest.fixture(scope="session")
def admin_token():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASS}, timeout=15)
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


@pytest.fixture(scope="session")
def staff_token():
    r = requests.post(f"{API}/auth/login", json={"email": STAFF_EMAIL, "password": STAFF_PASS}, timeout=15)
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


def hdr(tok):
    return {"Authorization": f"Bearer {tok}"}


# -------- auth --------
class TestAuth:
    def test_login_admin(self):
        r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASS}, timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert "access_token" in d and d["user"]["role"] == "admin"

    def test_login_staff(self):
        r = requests.post(f"{API}/auth/login", json={"email": STAFF_EMAIL, "password": STAFF_PASS}, timeout=15)
        assert r.status_code == 200
        assert r.json()["user"]["role"] == "staff"

    def test_login_invalid(self):
        r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": "wrong"}, timeout=15)
        assert r.status_code == 401

    def test_me_requires_auth(self):
        assert requests.get(f"{API}/auth/me", timeout=15).status_code == 401

    def test_me_admin(self, admin_token):
        r = requests.get(f"{API}/auth/me", headers=hdr(admin_token), timeout=15)
        assert r.status_code == 200 and r.json()["email"] == ADMIN_EMAIL


# -------- dashboard --------
class TestDashboard:
    def test_dashboard_kpis(self, admin_token):
        r = requests.get(f"{API}/dashboard", headers=hdr(admin_token), timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert d["jenis_barang"] == 11
        assert d["total_unit"] == 970
        assert d["gudang"] == 2
        assert "recent_surat_jalan" in d


# -------- items --------
class TestItems:
    def test_list_items_seeded(self, admin_token):
        r = requests.get(f"{API}/items", headers=hdr(admin_token), timeout=15)
        assert r.status_code == 200
        items = r.json()
        assert len(items) == 11
        assert all("brand_color" in i for i in items)

    def test_staff_cannot_create_item(self, staff_token, admin_token):
        wh = requests.get(f"{API}/warehouses", headers=hdr(admin_token)).json()[0]
        r = requests.post(f"{API}/items", headers=hdr(staff_token), json={
            "name": "TEST_x", "sku": "TEST-STAFF-DENY", "warehouse_id": wh["id"], "total_qty": 1
        })
        assert r.status_code == 403

    def test_staff_cannot_export(self, staff_token):
        r = requests.get(f"{API}/export/inventory.xlsx", headers=hdr(staff_token))
        assert r.status_code == 403

    def test_admin_crud_item(self, admin_token):
        wh = requests.get(f"{API}/warehouses", headers=hdr(admin_token)).json()[0]
        # create
        payload = {"name": "TEST_ItemCRUD", "sku": "TEST-CRUD-001", "warehouse_id": wh["id"], "total_qty": 5}
        r = requests.post(f"{API}/items", headers=hdr(admin_token), json=payload)
        assert r.status_code == 200, r.text
        item = r.json()
        assert item["available_qty"] == 5
        iid = item["id"]
        # get
        g = requests.get(f"{API}/items/{iid}", headers=hdr(admin_token))
        assert g.status_code == 200 and g.json()["sku"] == "TEST-CRUD-001"
        # update total_qty -> available adjusts
        u = requests.patch(f"{API}/items/{iid}", headers=hdr(admin_token), json={"total_qty": 8})
        assert u.status_code == 200 and u.json()["total_qty"] == 8 and u.json()["available_qty"] == 8
        # duplicate sku rejected
        wh2 = wh
        dup = requests.post(f"{API}/items", headers=hdr(admin_token), json={
            "name": "TEST_dup", "sku": "TEST-CRUD-001", "warehouse_id": wh2["id"], "total_qty": 1
        })
        assert dup.status_code == 400
        # delete
        d = requests.delete(f"{API}/items/{iid}", headers=hdr(admin_token))
        assert d.status_code == 200
        assert requests.get(f"{API}/items/{iid}", headers=hdr(admin_token)).status_code == 404

    def test_export_xlsx(self, admin_token):
        r = requests.get(f"{API}/export/inventory.xlsx", headers=hdr(admin_token))
        assert r.status_code == 200
        assert "spreadsheet" in r.headers.get("content-type", "")
        assert len(r.content) > 500


# -------- master data --------
class TestMaster:
    def test_warehouse_crud(self, admin_token):
        r = requests.post(f"{API}/warehouses", headers=hdr(admin_token), json={"name": "TEST_WH", "address": "x"})
        assert r.status_code == 200
        wid = r.json()["id"]
        u = requests.patch(f"{API}/warehouses/{wid}", headers=hdr(admin_token), json={"name": "TEST_WH2", "address": "y"})
        assert u.status_code == 200 and u.json()["name"] == "TEST_WH2"
        assert requests.delete(f"{API}/warehouses/{wid}", headers=hdr(admin_token)).status_code == 200

    def test_brand_crud_and_delete_guard(self, admin_token):
        r = requests.post(f"{API}/brands", headers=hdr(admin_token), json={"name": "TEST_Brand", "color": "#123456"})
        assert r.status_code == 200
        bid = r.json()["id"]
        assert r.json()["color"] == "#123456"
        # delete unused ok
        assert requests.delete(f"{API}/brands/{bid}", headers=hdr(admin_token)).status_code == 200
        # try delete brand with items -> 400
        brands = requests.get(f"{API}/brands", headers=hdr(admin_token)).json()
        items = requests.get(f"{API}/items", headers=hdr(admin_token)).json()
        used_brand_ids = {i["brand_id"] for i in items if i.get("brand_id")}
        used_brand = next((b for b in brands if b["id"] in used_brand_ids), None)
        if used_brand:
            d = requests.delete(f"{API}/brands/{used_brand['id']}", headers=hdr(admin_token))
            assert d.status_code == 400

    def test_category_crud(self, admin_token):
        r = requests.post(f"{API}/categories", headers=hdr(admin_token), json={"name": "TEST_Cat"})
        assert r.status_code == 200
        cid = r.json()["id"]
        assert requests.delete(f"{API}/categories/{cid}", headers=hdr(admin_token)).status_code == 200

    def test_staff_denied_master(self, staff_token):
        assert requests.post(f"{API}/warehouses", headers=hdr(staff_token), json={"name": "x"}).status_code == 403
        assert requests.post(f"{API}/brands", headers=hdr(staff_token), json={"name": "x", "color": "#000000"}).status_code == 403
        assert requests.post(f"{API}/categories", headers=hdr(staff_token), json={"name": "x"}).status_code == 403
        assert requests.get(f"{API}/users", headers=hdr(staff_token)).status_code == 403

    def test_create_user(self, admin_token):
        email = "test_newuser@example.com"
        # Ensure clean if re-run: skip if exists
        r = requests.post(f"{API}/users", headers=hdr(admin_token), json={
            "email": email, "full_name": "TEST_User", "password": "Passw0rd!", "role": "staff"
        })
        assert r.status_code in (200, 400)
        if r.status_code == 200:
            assert r.json()["email"] == email


# -------- surat jalan + return --------
class TestSuratJalan:
    def test_full_sj_and_return_flow(self, admin_token):
        # find Gudang Pusat + an item with enough qty
        whs = requests.get(f"{API}/warehouses", headers=hdr(admin_token)).json()
        wh = next(w for w in whs if w["name"] == "Gudang Pusat")
        items = requests.get(f"{API}/items", headers=hdr(admin_token), params={"warehouse_id": wh["id"]}).json()
        # pick one item with available_qty>=6
        item = next(i for i in items if i["available_qty"] >= 6)
        iid = item["id"]
        before_avail = item["available_qty"]
        before_total = item["total_qty"]

        # create SJ with qty=6
        payload = {
            "warehouse_id": wh["id"],
            "recipient_name": "TEST Recipient",
            "event_name": "TEST Event",
            "event_date": "2026-01-15",
            "items": [{"item_id": iid, "qty": 6}]
        }
        r = requests.post(f"{API}/surat-jalan", headers=hdr(admin_token), json=payload)
        assert r.status_code == 200, r.text
        sj = r.json()
        assert sj["sj_number"].startswith("SJ-")
        assert sj["qr_token"] and sj["status"] == "out"
        sj_id = sj["id"]
        qr = sj["qr_token"]

        # available deducted
        after = requests.get(f"{API}/items/{iid}", headers=hdr(admin_token)).json()
        assert after["available_qty"] == before_avail - 6

        # by-token
        b = requests.get(f"{API}/surat-jalan/by-token/{qr}", headers=hdr(admin_token))
        assert b.status_code == 200 and b.json()["id"] == sj_id

        # partial return: 2 baik, 1 rusak
        r1 = requests.post(f"{API}/surat-jalan/{sj_id}/return", headers=hdr(admin_token), json={
            "lines": [{"item_id": iid, "returned_qty": 2, "damaged_qty": 1, "lost_qty": 0, "used_qty": 0}]
        })
        assert r1.status_code == 200
        assert r1.json()["status"] == "partial"
        mid = requests.get(f"{API}/items/{iid}", headers=hdr(admin_token)).json()
        assert mid["available_qty"] == before_avail - 6 + 2
        assert mid["damaged_qty"] == 1
        assert mid["total_qty"] == before_total  # rusak doesn't reduce total

        # final return: 1 hilang, 2 terpakai (total remaining 3)
        r2 = requests.post(f"{API}/surat-jalan/{sj_id}/return", headers=hdr(admin_token), json={
            "lines": [{"item_id": iid, "returned_qty": 0, "damaged_qty": 0, "lost_qty": 1, "used_qty": 2}]
        })
        assert r2.status_code == 200
        assert r2.json()["status"] == "returned"
        end = requests.get(f"{API}/items/{iid}", headers=hdr(admin_token)).json()
        assert end["lost_qty"] == 1
        assert end["used_qty"] == 2
        # total decreased by lost+used = 3
        assert end["total_qty"] == before_total - 3

        # already-returned cannot return again
        r3 = requests.post(f"{API}/surat-jalan/{sj_id}/return", headers=hdr(admin_token), json={
            "lines": [{"item_id": iid, "returned_qty": 1}]
        })
        assert r3.status_code == 400

    def test_sj_insufficient_stock(self, admin_token):
        whs = requests.get(f"{API}/warehouses", headers=hdr(admin_token)).json()
        wh = whs[0]
        items = requests.get(f"{API}/items", headers=hdr(admin_token)).json()
        item = items[0]
        r = requests.post(f"{API}/surat-jalan", headers=hdr(admin_token), json={
            "warehouse_id": wh["id"], "recipient_name": "x", "event_name": "x",
            "items": [{"item_id": item["id"], "qty": 999999}]
        })
        assert r.status_code == 400

    def test_sj_list_filters(self, admin_token):
        for f in ("aktif", "selesai"):
            r = requests.get(f"{API}/surat-jalan", headers=hdr(admin_token), params={"status_filter": f})
            assert r.status_code == 200
            assert isinstance(r.json(), list)


# -------- penerimaan --------
class TestPenerimaan:
    def test_create_penerimaan_existing_and_new(self, admin_token):
        whs = requests.get(f"{API}/warehouses", headers=hdr(admin_token)).json()
        wh = whs[0]
        items = requests.get(f"{API}/items", headers=hdr(admin_token)).json()
        existing = items[0]
        before_total = existing["total_qty"]
        before_avail = existing["available_qty"]

        import uuid as _u
        new_sku = f"TEST-NEW-{_u.uuid4().hex[:8]}"
        payload = {
            "warehouse_id": wh["id"],
            "supplier_name": "TEST Supplier",
            "receipt_date": "2026-01-15",
            "items": [
                {"mode": "existing", "item_id": existing["id"], "qty": 3},
                {"mode": "new", "name": "TEST_NewItem", "sku": new_sku, "qty": 7}
            ]
        }
        r = requests.post(f"{API}/penerimaan", headers=hdr(admin_token), json=payload)
        assert r.status_code == 200, r.text
        p = r.json()
        assert p["receipt_number"].startswith("PBK-")
        assert any(l.get("is_new") for l in p["items"])
        # existing item incremented
        after = requests.get(f"{API}/items/{existing['id']}", headers=hdr(admin_token)).json()
        assert after["total_qty"] == before_total + 3
        assert after["available_qty"] == before_avail + 3

    def test_penerimaan_new_dup_sku(self, admin_token):
        whs = requests.get(f"{API}/warehouses", headers=hdr(admin_token)).json()
        items = requests.get(f"{API}/items", headers=hdr(admin_token)).json()
        existing_sku = items[0]["sku"]
        r = requests.post(f"{API}/penerimaan", headers=hdr(admin_token), json={
            "warehouse_id": whs[0]["id"], "supplier_name": "x",
            "items": [{"mode": "new", "name": "dup", "sku": existing_sku, "qty": 1}]
        })
        assert r.status_code == 400
