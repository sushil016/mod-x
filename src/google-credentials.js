import fs from "fs";
import os from "os";
import path from "path";

let prepared = false;

export function prepareGoogleCredentials() {
  if (prepared) return;
  prepared = true;

  const rawJson =
    process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON ||
    decodeBase64Json(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON_BASE64);

  if (rawJson) {
    process.env.GOOGLE_APPLICATION_CREDENTIALS = writeNormalizedCredentials(rawJson);
    return;
  }

  const credentialsRef = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!credentialsRef) return;

  const trimmed = credentialsRef.trim();
  const looksLikeJson = trimmed.startsWith("{") && trimmed.endsWith("}");

  if (looksLikeJson) {
    process.env.GOOGLE_APPLICATION_CREDENTIALS = writeNormalizedCredentials(trimmed);
    return;
  }

  if (fs.existsSync(credentialsRef)) {
    const fileJson = fs.readFileSync(credentialsRef, "utf8");
    process.env.GOOGLE_APPLICATION_CREDENTIALS = writeNormalizedCredentials(fileJson);
  }
}

function decodeBase64Json(value) {
  if (!value) return "";
  return Buffer.from(value, "base64").toString("utf8");
}

function writeNormalizedCredentials(rawJson) {
  const credentials = parseCredentials(rawJson);
  const credentialsPath = path.join(os.tmpdir(), "google-service-account.json");
  fs.writeFileSync(credentialsPath, `${JSON.stringify(credentials, null, 2)}\n`, { mode: 0o600 });
  return credentialsPath;
}

function parseCredentials(rawJson) {
  try {
    const credentials = JSON.parse(stripWrappingQuotes(rawJson.trim()));

    if (credentials.private_key) {
      credentials.private_key = credentials.private_key.replace(/\\n/g, "\n");
    }

    if (credentials.type !== "service_account" || !credentials.client_email || !credentials.private_key) {
      throw new Error("expected service account JSON with type, client_email, and private_key");
    }

    return credentials;
  } catch (err) {
    throw new Error(`Invalid Google service account credentials: ${err.message}`);
  }
}

function stripWrappingQuotes(value) {
  const wrappedInSingleQuotes = value.startsWith("'") && value.endsWith("'");
  const wrappedInDoubleQuotes = value.startsWith('"') && value.endsWith('"');
  return wrappedInSingleQuotes || wrappedInDoubleQuotes ? value.slice(1, -1) : value;
}
