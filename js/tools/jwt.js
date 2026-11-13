(() => {
  "use strict";

  const { $, copyText, h, setupTabs } = UI;

  const HASHES = { HS256: "SHA-256", HS384: "SHA-384", HS512: "SHA-512" };

  const encoder = new TextEncoder();
  const decoder = new TextDecoder("utf-8", { fatal: true });

  // --- base64url (UTF-8 safe) ------------------------------------------------

  function bytesToBase64Url(bytes) {
    let binary = "";
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  const textToBase64Url = (text) => bytesToBase64Url(encoder.encode(text));

  function base64UrlToText(value) {
    const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    return decoder.decode(Uint8Array.from(atob(padded), (char) => char.charCodeAt(0)));
  }

  // --- JWT ---------------------------------------------------------------------

  async function signJwt(header, payload, secret) {
    const data = `${textToBase64Url(JSON.stringify(header))}.${textToBase64Url(JSON.stringify(payload))}`;
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: HASHES[header.alg] },
      false,
      ["sign"],
    );
    const signature = bytesToBase64Url(new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(data))));
    return { token: `${data}.${signature}`, signature };
  }

  function parseJwt(token) {
    const parts = token.split(".");
    if (parts.length !== 3) throw new Error("Invalid JWT format: expected 3 parts separated by dots.");
    try {
      return {
        header: JSON.parse(base64UrlToText(parts[0])),
        payload: JSON.parse(base64UrlToText(parts[1])),
        signature: parts[2],
      };
    } catch {
      throw new Error("Invalid JWT: header or payload is not valid base64url-encoded JSON.");
    }
  }

  /** Add human-readable versions of the standard timestamp claims. */
  function annotateTimestamps(payload) {
    const annotated = { ...payload };
    for (const claim of ["iat", "exp", "nbf"]) {
      if (typeof payload[claim] === "number") {
        annotated[`${claim}_readable`] = new Date(payload[claim] * 1000).toLocaleString();
      }
    }
    return annotated;
  }

  // --- UI ----------------------------------------------------------------------

  function renderParts(container, { header, payload, signature }) {
    const part = (kind, title, body) =>
      h(
        "div",
        { className: `jwt-part jwt-part--${kind}` },
        h("h3", { textContent: title }),
        h("pre", { textContent: body }),
      );
    container.replaceChildren(
      part("header", "Header", JSON.stringify(header, null, 2)),
      part("payload", "Payload", JSON.stringify(payload, null, 2)),
      part("signature", "Signature", signature),
    );
  }

  function showError(el, error) {
    el.textContent = error ? `Error: ${error.message}` : "";
    el.hidden = !error;
  }

  function parseJsonField(id, label) {
    try {
      return JSON.parse($(`#${id}`).value);
    } catch (error) {
      throw new Error(`${label} is not valid JSON (${error.message})`);
    }
  }

  $("#encodeForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const result = $("#encodeResult");
    try {
      const header = { ...parseJsonField("header", "Header"), alg: $("#algorithm").value };
      const payload = parseJsonField("payload", "Payload");
      if (!crypto.subtle) throw new Error("Signing needs a secure (https) page.");

      const { token, signature } = await signJwt(header, payload, $("#secret").value);
      $("#jwtOutput").value = token;
      renderParts($("#encodeParts"), { header, payload, signature });
      showError($("#encodeError"), null);
      result.hidden = false;
    } catch (error) {
      showError($("#encodeError"), error);
      result.hidden = true;
    }
    $("#encodeHint").hidden = true;
  });

  $("#decodeForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const parts = $("#decodeParts");
    try {
      const token = $("#jwtInput").value.trim();
      if (!token) throw new Error("Please enter a JWT token.");

      const { header, payload, signature } = parseJwt(token);
      renderParts(parts, { header, payload: annotateTimestamps(payload), signature });
      $("#expiredWarning").hidden = !(typeof payload.exp === "number" && Date.now() > payload.exp * 1000);
      $("#decodeNote").hidden = false;
      showError($("#decodeError"), null);
    } catch (error) {
      parts.replaceChildren();
      $("#expiredWarning").hidden = true;
      $("#decodeNote").hidden = true;
      showError($("#decodeError"), error);
    }
  });

  $("#copyJwtBtn").addEventListener("click", () => copyText($("#jwtOutput").value));

  setupTabs($("[role=tablist]"));

  const now = Math.floor(Date.now() / 1000);
  $("#header").value = JSON.stringify({ typ: "JWT", alg: "HS256" }, null, 2);
  $("#payload").value = JSON.stringify({ sub: "1234567890", name: "John Doe", iat: now, exp: now + 3600 }, null, 2);
})();
