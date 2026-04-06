export type LocalityEmergencyDetails = {
  countryCode: string;
  localityLabel: string;
  emergencyNumber: string;
  womensHelpline: string;
  mentalHealthLine: string;
};

type ReverseGeocodeResponse = {
  address?: {
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    county?: string;
    country?: string;
    country_code?: string;
  };
};

const emergencyByCountry: Record<string, Omit<LocalityEmergencyDetails, "countryCode" | "localityLabel">> = {
  us: { emergencyNumber: "911", womensHelpline: "1-800-799-7233", mentalHealthLine: "988" },
  ca: { emergencyNumber: "911", womensHelpline: "1-866-863-0511", mentalHealthLine: "988" },
  gb: { emergencyNumber: "999", womensHelpline: "0808-2000-247", mentalHealthLine: "111" },
  in: { emergencyNumber: "112", womensHelpline: "181", mentalHealthLine: "9152987821" },
  au: { emergencyNumber: "000", womensHelpline: "1800-737-732", mentalHealthLine: "13-11-14" },
};

const fallbackDetails: LocalityEmergencyDetails = {
  countryCode: "global",
  localityLabel: "Current location",
  emergencyNumber: "112",
  womensHelpline: "1-800-799-7233",
  mentalHealthLine: "988",
};

export async function getLocalityEmergencyDetails(lat: number, lon: number): Promise<LocalityEmergencyDetails> {
  try {
    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.searchParams.set("lat", String(lat));
    url.searchParams.set("lon", String(lon));
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("addressdetails", "1");

    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return fallbackDetails;
    }

    const result = (await response.json()) as ReverseGeocodeResponse;
    const address = result.address || {};
    const countryCode = (address.country_code || "").toLowerCase();
    const details = emergencyByCountry[countryCode] || fallbackDetails;
    const localityLabel =
      address.city ||
      address.town ||
      address.village ||
      address.state ||
      address.county ||
      address.country ||
      fallbackDetails.localityLabel;

    return {
      countryCode: countryCode || fallbackDetails.countryCode,
      localityLabel,
      emergencyNumber: details.emergencyNumber,
      womensHelpline: details.womensHelpline,
      mentalHealthLine: details.mentalHealthLine,
    };
  } catch {
    return fallbackDetails;
  }
}
