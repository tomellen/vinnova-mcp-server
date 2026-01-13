export interface VinnovaProject {
  projektID: string;
  projektTitel: string;
  projektStart?: string;
  projektSlut?: string;
  utlysningID?: string;
  utlysningNamn?: string;
  organisationNamn?: string;
  organisationOrganisationsNummer?: string;
  organisationKommun?: string;
  organisationLan?: string;
  beviljandeAr?: number;
  beviljatBidrag?: number;
  projektStatus?: string;
  sammanfattning?: string;
  koordinator?: boolean;
  [key: string]: any;
}

export interface SearchParams {
  startDate?: string;
  endDate?: string;
  organization?: string;
  keyword?: string;
  minAmount?: number;
  maxAmount?: number;
  limit?: number;
  kommun?: string;
  lan?: string;
}
