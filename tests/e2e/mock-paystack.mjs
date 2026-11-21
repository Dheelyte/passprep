// Minimal Paystack stand-in for end-to-end tests.
// initialize → returns a checkout URL on this server; /checkout "pays" and redirects to the callback;
// verify → reports success with the initialized amount.
import http from "node:http";

const port = Number(process.env.MOCK_PAYSTACK_PORT ?? 3199);
const txs = new Map();

const send = (res, code, body) => {
  res.writeHead(code, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
};

http
  .createServer(async (req, res) => {
    const url = new URL(req.url, `http://localhost:${port}`);
    let body = "";
    for await (const chunk of req) body += chunk;

    if (req.method === "POST" && url.pathname === "/transaction/initialize") {
      const b = JSON.parse(body || "{}");
      txs.set(b.reference, { ...b, status: "pending" });
      return send(res, 200, {
        status: true,
        data: { authorization_url: `http://localhost:${port}/checkout?reference=${b.reference}`, access_code: "x", reference: b.reference },
      });
    }
    if (url.pathname === "/checkout") {
      const ref = url.searchParams.get("reference");
      const tx = txs.get(ref);
      if (!tx) return send(res, 404, { status: false });
      tx.status = "success";
      res.writeHead(302, { Location: `${tx.callback_url}?reference=${ref}&trxref=${ref}` });
      return res.end();
    }
    const m = /^\/transaction\/verify\/(.+)$/.exec(url.pathname);
    if (m) {
      const tx = txs.get(decodeURIComponent(m[1]));
      if (!tx) return send(res, 404, { status: false, message: "not found" });
      return send(res, 200, {
        status: true,
        data: {
          reference: tx.reference,
          status: tx.status,
          amount: tx.amount,
          channel: "bank_transfer",
          paid_at: new Date().toISOString(),
          customer: { email: tx.email, customer_code: "CUS_mock" },
          plan: null,
          metadata: tx.metadata,
        },
      });
    }
    if (url.pathname === "/health") return send(res, 200, { ok: true });
    send(res, 404, { status: false, message: "unknown route" });
  })
  .listen(port, () => console.log(`mock paystack on ${port}`));
