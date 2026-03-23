export interface AppSettings {
  id: number;
  companyName: string;
  companyId?: string;
  companyLogoUrl?: string;
  licenseStartDate?: Date;
  licenseEndDate?: Date;
  smtpEmail?: string;
  smtpPassword?: string;
}
