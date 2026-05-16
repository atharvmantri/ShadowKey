export async function loadContractAddress(): Promise<string | null> {
  try {
    const res = await fetch('/contract-address.json');
    const data = await res.json();
    return data.address || null;
  } catch {
    return null;
  }
}
