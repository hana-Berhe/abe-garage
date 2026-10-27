-- BE-021: the VIN is optional, up to 32 characters, and two cars may share one. Run once.
ALTER TABLE vehicles
  DROP INDEX uq_vehicles_vin,
  MODIFY vin VARCHAR(32) NULL,
  ADD KEY ix_vehicles_vin (vin);
