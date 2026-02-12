"use client";

import Image from "next/image";
import Link from "next/link";
import styles from "./WatchProviders.module.css";

interface Provider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
}

interface WatchProvidersProps {
  providers: {
    results?: {
      [key: string]: {
        link?: string;
        flatrate?: Provider[];
        buy?: Provider[];
        rent?: Provider[];
      };
    };
  };
  region?: string;
}

export const WatchProviders = ({ providers, region = "US" }: WatchProvidersProps) => {
  const regionData = providers?.results?.[region];

  if (!regionData || !regionData.flatrate || regionData.flatrate.length === 0) {
    return null;
  }

  // Deduplicate providers just in case
  const uniqueProviders = regionData.flatrate.filter(
    (provider, index, self) =>
      index === self.findIndex((t) => t.provider_id === provider.provider_id)
  );

  return (
    <div className={styles.container}>
      <span className={styles.title}>Stream on</span>
      <div className={styles.providerList}>
        {uniqueProviders.slice(0, 5).map((provider) => (
          <Link
            key={provider.provider_id}
            href={regionData.link || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.providerLink}
            title={`Watch on ${provider.provider_name}`}
          >
            <Image
              src={`https://image.tmdb.org/t/p/original${provider.logo_path}`}
              alt={provider.provider_name}
              width={40}
              height={40}
              className={styles.providerLogo}
              unoptimized
            />
          </Link>
        ))}
      </div>
      <div className={styles.attribution}>
        Powered by JustWatch
      </div>
    </div>
  );
};
