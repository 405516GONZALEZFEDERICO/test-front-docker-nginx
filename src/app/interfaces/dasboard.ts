export interface GetPlantFlagDto {
    id: number;         
    name: string;        
    readings: number;    
    medAlerts: number;   
    redAlerts: number;  
    sensorsDisabled: number;  
    country: string;     
    flag: string;        
    status: boolean;     
    url:String;
  }

  export interface UpdatePlantDto {
    id: number;         
    name: string;        
    readings: number;    
    medAlerts: number;   
    redAlerts: number;  
    sensorsDisabled: number;  
    country: string;     
    flag: string;        
    status: boolean;     
  }


  export interface Plant {
    name: string;
    country: string;
  }
  

  export interface EnvironmentalData {
    ok: number;
    medium: number;
    red: number;
  }
  
  export interface CountryEnvironmentalData {
    country: string;
    temperature: EnvironmentalData;
    pressure: EnvironmentalData;
    wind: EnvironmentalData;
    levels: EnvironmentalData;
    energy: EnvironmentalData;
    tension: EnvironmentalData;
    carbon_monoxide: EnvironmentalData;
    other_gases: EnvironmentalData;
  }