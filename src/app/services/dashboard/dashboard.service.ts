import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { CountryEnvironmentalData, GetPlantFlagDto, Plant, UpdatePlantDto } from '../../interfaces/dasboard';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private http = inject(HttpClient);
  private baseUrl = environment.apis.be;

  getPlants(): Observable<GetPlantFlagDto[]> {
    return this.http.get<GetPlantFlagDto[]>(`${this.baseUrl}plant/getPlants2`);
  }

  getAllMetrics(): Observable<CountryEnvironmentalData> {
    return this.http.get<CountryEnvironmentalData>(environment.apis.metrics);
  }

  createPlant(plant: Plant): Observable<Plant> {
    return this.http.post<Plant>(`${this.baseUrl}plant/newPlant`, plant);
  }

  updtePlant(plant: UpdatePlantDto): Observable<Plant> {
    return this.http.put<Plant>(`${this.baseUrl}plant/updatePlant`, plant);
  }

  deletePlant(id: number): Observable<Plant> {
    return this.http.patch<Plant>(`${this.baseUrl}plant/logicDown/${id}`, {});
  }
}