export interface AppSettings {
  id: number;
  companyName: string;
  companyLogoUrl?: string;
  licenseStartDate?: Date;
  licenseEndDate?: Date;
  smtpEmail?: string;
  smtpPassword?: string;
}
