/**
 * A geographical point, mirroring the `GeoPoint` class of the Firestore SDKs so
 * that document types stay portable between packages.
 */
export class GeoPoint {
  readonly latitude: number;
  readonly longitude: number;

  constructor(latitude: number, longitude: number) {
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      throw new RangeError(
        `GeoPoint latitude must be between -90 and 90, received ${String(latitude)}`,
      );
    }
    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      throw new RangeError(
        `GeoPoint longitude must be between -180 and 180, received ${String(longitude)}`,
      );
    }

    this.latitude = latitude;
    this.longitude = longitude;
  }

  isEqual(other: GeoPoint): boolean {
    return (
      this.latitude === other.latitude && this.longitude === other.longitude
    );
  }

  toJSON(): { latitude: number; longitude: number } {
    return { latitude: this.latitude, longitude: this.longitude };
  }
}
