type ErrorLike = {
  code?: string;
  message?: string;
  details?: string;
};

let forceMockMode = false;
const STORAGE_KEY = "karigari_force_mock_mode";

export function isSchemaMissingError(error: ErrorLike | null | undefined) {
  if (!error) return false;
  const blob = `${error.code ?? ""} ${error.message ?? ""} ${error.details ?? ""}`.toLowerCase();
  return (
    blob.includes("pgrst") ||
    blob.includes("does not exist") ||
    blob.includes("relation") ||
    blob.includes("not found")
  );
}

export function shouldUseMockData() {
  if (typeof window !== "undefined" && !forceMockMode) {
    forceMockMode = window.localStorage.getItem(STORAGE_KEY) === "1";
  }
  return forceMockMode;
}

export function enableMockDataMode() {
  forceMockMode = true;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, "1");
  }
}

export function disableMockDataMode() {
  forceMockMode = false;
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}
