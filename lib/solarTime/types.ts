export interface BirthPlace {
  province: string; // 省
  city: string; // 市
  district?: string; // 区/县 (optional, required for direct-administered municipalities)
}

export interface SolarTimeAdjustment {
  standardTime: Date; // input standard time
  birthPlace: BirthPlace; // birthplace
  longitude: number; // birthplace longitude
  longitudeOffsetMinutes: number; // longitude correction (minutes, can be negative)
  equationOfTimeMinutes: number; // equation of time correction (minutes, can be negative)
  totalOffsetMinutes: number; // total correction (minutes)
  solarTime: Date; // adjusted true solar time
}
