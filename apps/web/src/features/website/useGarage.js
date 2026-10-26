import { useEffect, useState } from "react";
import websiteApi from "./website.api";
import serviceApi from "../services/service.api";

// Garage details and the price list are read once per visit and shared by the header, footer and pages.
let garagePromise = null;
let servicesPromise = null;

export function useGarage() {
  const [garage, setGarage] = useState(null);
  useEffect(() => {
    garagePromise = garagePromise || websiteApi.garage().catch(() => ({}));
    garagePromise.then(setGarage);
  }, []);
  return garage || {};
}

export function usePublicServices() {
  const [services, setServices] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    servicesPromise = servicesPromise || serviceApi.listPublic();
    servicesPromise.then(setServices).catch((e) => { servicesPromise = null; setError(e.message); });
  }, []);
  return { services, error };
}
