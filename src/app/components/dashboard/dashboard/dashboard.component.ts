import { Component, HostListener, inject, OnDestroy, OnInit } from '@angular/core';
import { AuthService } from '../../../services/login-service/auth.service';
import { NavbarComponent } from "../../navbar/navbar/navbar.component";
import { DashboardService } from '../../../services/dashboard/dashboard.service';
import { CountryEnvironmentalData, GetPlantFlagDto, Plant, UpdatePlantDto } from '../../../interfaces/dasboard';
import { Subscription } from 'rxjs';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [NavbarComponent, ReactiveFormsModule, CommonModule],
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit, OnDestroy {
    private dashboardService = inject(DashboardService);
    private authService = inject(AuthService);

    plants?: GetPlantFlagDto[];
    metrics?: CountryEnvironmentalData[] = [];
    private subscriptions: Subscription[] = [];

    clectures: number = 0;
    cmedAlerts: number = 0;
    credAlerts: number = 0;
    csensorsDisabled: number = 0;

    userName: string = '';
    activeDropdownIndex: number | null = null;
    selectedCountryData: CountryEnvironmentalData | undefined;
    lFlag: string = "";
    sCountry: string = "";
    sName: string = "";
    searchTerm = new FormControl("");

    isPopupVisible: boolean = false;
    isPopupEditVisible: boolean = false;
    plant?: Plant;

    plantToUpdate: UpdatePlantDto = {
        id: 0,
        name: "",
        country: "",
        readings: 0,
        medAlerts: 0,
        redAlerts: 0,
        sensorsDisabled: 0,
        flag: "",
        status: false
    };


    plantForm: FormGroup = new FormGroup({
        namePlant: new FormControl('', [Validators.required, Validators.minLength(3)]),
        country: new FormControl('', [Validators.required])
    });
    plantFormEdit: FormGroup = new FormGroup({
        namePlantEdit: new FormControl('', [Validators.required, Validators.minLength(3)]),
        country: new FormControl('', [Validators.required]),
        lecture: new FormControl('', [Validators.required, Validators.pattern('^[0-9]*$')]),
        medAlert: new FormControl('', [Validators.required, Validators.pattern('^[0-9]*$')]),
        redAlert: new FormControl('', [Validators.required, Validators.pattern('^[0-9]*$')]),
        sensor: new FormControl('', [Validators.required, Validators.pattern('^[0-9]*$')])
    });

    loadPlantData(plant: GetPlantFlagDto): void {
        if (this.plantToUpdate) {
            this.plantToUpdate.id = plant.id;
            this.plantToUpdate.flag = plant.flag;
            this.plantToUpdate.status = plant.status;

            this.plantFormEdit.patchValue({
                namePlantEdit: plant.name,
                country: plant.country,
                lecture: plant.readings,
                medAlert: plant.medAlerts,
                redAlert: plant.redAlerts,
                sensor: plant.sensorsDisabled
            });
        }
    }


    onSubmit(): void {


        if (this.plantForm.valid) {
            const formData = {
                name: this.plantForm.value.namePlant,
                country: this.plantForm.value.country
            };

            const createSubscription = this.dashboardService.createPlant(formData).subscribe({
                next: (newPlant) => {
                    this.plantForm.reset();
                    this.closePopup();

                    setTimeout(() => {
                        this.loadPlants();
                        this.calculateTotals();
                    }, 300);
                }
            });
            this.subscriptions.push(createSubscription);
        }
    }

    onSubmitEdit(): void {
        if (this.plantFormEdit.valid) {
            const formData = {
                id: this.plantToUpdate?.id,
                name: this.plantFormEdit.value.namePlantEdit,
                country: this.plantFormEdit.value.country,
                readings: Number(this.plantFormEdit.value.lecture),
                medAlerts: Number(this.plantFormEdit.value.medAlert),
                redAlerts: Number(this.plantFormEdit.value.redAlert),
                sensorsDisabled: Number(this.plantFormEdit.value.sensor),
                flag: this.plantToUpdate?.flag,
                status: this.plantToUpdate?.status
            };

            const createSubscription = this.dashboardService.updtePlant(formData).subscribe({
                next: (newPlant) => {
                    this.plantFormEdit.reset();
                    this.closePopup();

                    setTimeout(() => {
                        this.loadPlants();
                        this.calculateTotals();
                    }, 300);
                }
            });
            this.subscriptions.push(createSubscription);
        }
    }



    closePopup(): void {
        this.isPopupVisible = false;
        this.isPopupEditVisible = false;
    }



    onTogglePopCreate(): void {

        this.isPopupVisible = true;
    }

    onModifyClick(plant: GetPlantFlagDto): void {
        this.isPopupEditVisible = true;
        this.loadPlantData(plant);
        this.activeDropdownIndex = null;
    }
    @HostListener('document:click', ['$event'])
    closeDropdowns(event: MouseEvent): void {
        if (!event.target || !(event.target as Element).closest('.dropdown')) {
            this.activeDropdownIndex = null;
        }
    }

    toggleDropdown(event: MouseEvent, index: number): void {
        event.stopPropagation();
        this.activeDropdownIndex = this.activeDropdownIndex === index ? null : index;
    }



    onDeleteClick(plant: GetPlantFlagDto): void {
        console.log(plant.id)

        const deleteSubscription = this.dashboardService.deletePlant(plant.id).subscribe({
            next: () => {
                setTimeout(() => {
                    this.loadPlants();
                }, 300);
            }

        });

        this.subscriptions.push(deleteSubscription);
        this.activeDropdownIndex = null;
    }



    calculateTotals(): void {

        this.clectures = 0;
        this.cmedAlerts = 0;
        this.credAlerts = 0;
        this.csensorsDisabled = 0;
        this.plants?.forEach(plant => {
            this.clectures += plant.readings;
            this.cmedAlerts += plant.medAlerts;
            this.credAlerts += plant.redAlerts;
            this.csensorsDisabled += plant.sensorsDisabled;
        });
    }

    loadPlants(): void {
        const subscription = this.dashboardService.getPlants().subscribe({
            next: (data) => {
                this.plants = data;
                this.calculateTotals();
            }
        });
        this.subscriptions.push(subscription);
    }

    loadMetrics(): void {
        const subscription = this.dashboardService.getAllMetrics().subscribe({
            next: (data) => {
                if (Array.isArray(data)) {
                    this.metrics = data;
                }
            }
        });
        this.subscriptions.push(subscription);
    }


    onRowClick(plant: GetPlantFlagDto): void {
        this.lFlag = plant.flag;
        this.sCountry = plant.country;
        this.sName = plant.name;

        this.selectedCountryData = this.metrics?.find((metric: CountryEnvironmentalData) =>
            metric.country.toLowerCase() === plant.country.toLowerCase()
        );
    }

    calculateMetrics(nameCountry: string): void {
        this.selectedCountryData = this.metrics?.find((metric: CountryEnvironmentalData) =>
            metric.country.toLowerCase() === nameCountry.toLowerCase()
        );
    }
    ngOnInit() {
        this.loadPlants();
        this.calculateTotals();
        this.loadMetrics();
        this.userName = this.authService.getUserNameFromToken();
        this.filterPlants();
    }
    ngOnDestroy() {
        this.subscriptions.forEach(sub => sub.unsubscribe());
    }

    filterPlants() {
        const sub = this.searchTerm.valueChanges.subscribe(search => {
            const searchTerm = search?.trim().toLocaleLowerCase() || '';
            if (!this.searchTerm.value) {
                this.loadPlants()
            }
            else {
                this.plants = this.plants?.filter(plant => {
                    const name = plant.name.toLocaleLowerCase();
                    const country = plant.country.toLocaleLowerCase();
                    return name.includes(searchTerm) || country.includes(searchTerm);
                })
            }
        })
        this.subscriptions.push(sub);
    }
}
