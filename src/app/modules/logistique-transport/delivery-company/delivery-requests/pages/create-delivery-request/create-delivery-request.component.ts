import { Component, AfterViewInit, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import * as L from 'leaflet';
import Swal from 'sweetalert2';
import { NavbarComponent } from '../../../../shared/navbar/navbar.component';
import { environment } from '../../../../../../../environments/environment';

@Component({
  selector: 'app-create-delivery-request',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NavbarComponent],
  templateUrl: './create-delivery-request.component.html',
  styleUrl: './create-delivery-request.component.css'
})
export class CreateDeliveryRequestComponent implements OnInit, AfterViewInit {
  requestForm!: FormGroup;
  map!: L.Map;
  pickupMarker: L.Marker | null = null;
  deliveryMarker: L.Marker | null = null;
  
  pickupLat: number | null = null;
  pickupLng: number | null = null;
  deliveryLat: number | null = null;
  deliveryLng: number | null = null;

  activeMode: 'pickup' | 'delivery' = 'pickup';
  loading = false;
  
  pickupIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  deliveryIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  constructor(private fb: FormBuilder, private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.requestForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      weightKg: [1, [Validators.required, Validators.min(0.1)]],
      pickupAddress: ['', Validators.required],
      deliveryAddress: ['', Validators.required],
      requestedPickupStart: ['', Validators.required],
      requestedPickupEnd: ['', Validators.required],
      requestedDeliveryEnd: ['', Validators.required],
      urgency: ['NORMAL', Validators.required]
    });
  }

  ngAfterViewInit() {
    this.initMap();
  }

  setMode(mode: 'pickup' | 'delivery') {
    this.activeMode = mode;
  }

  private initMap(): void {
    this.map = L.map('map', {
      center: [36.8065, 10.1815],
      zoom: 12
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    this.map.on('click', (e: any) => {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;
      
      this.reverseGeocode(lat, lng, this.activeMode);
      
      if (this.activeMode === 'pickup') {
        this.pickupLat = lat;
        this.pickupLng = lng;
        if (this.pickupMarker) {
          this.pickupMarker.setLatLng(e.latlng);
        } else {
          this.pickupMarker = L.marker([lat, lng], { icon: this.pickupIcon }).addTo(this.map);
        }
      } else {
        this.deliveryLat = lat;
        this.deliveryLng = lng;
        if (this.deliveryMarker) {
          this.deliveryMarker.setLatLng(e.latlng);
        } else {
          this.deliveryMarker = L.marker([lat, lng], { icon: this.deliveryIcon }).addTo(this.map);
        }
      }
    });
  }

  private reverseGeocode(lat: number, lon: number, mode: 'pickup' | 'delivery') {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
    
    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data && data.display_name) {
          if (mode === 'pickup') {
            this.requestForm.patchValue({ pickupAddress: data.display_name });
          } else {
            this.requestForm.patchValue({ deliveryAddress: data.display_name });
          }
        }
      })
      .catch(err => console.error("Geocoding failed", err));
  }

  onSubmit() {
    if (this.requestForm.invalid) {
      Swal.fire('Erreur', 'Veuillez remplir tous les champs obligatoires.', 'warning');
      return;
    }

    this.loading = true;
    const payload = {
      ...this.requestForm.value,
      pickupLatitude: this.pickupLat,
      pickupLongitude: this.pickupLng,
      deliveryLatitude: this.deliveryLat,
      deliveryLongitude: this.deliveryLng,
      batchId: 7, 
      companyDeliveryId: 1, 
      donorId: 1, 
      receiverId: 2, 
    };

    this.http.post(`${environment.apiBaseUrl}/api/delivery-requests`, payload)
      .subscribe({
        next: () => {
          this.loading = false;
          Swal.fire('Succès', 'Demande de livraison créée !', 'success').then(() => {
            this.router.navigate(['/delivery-company/delivery-requests']);
          });
        },
        error: (err) => {
          this.loading = false;
          Swal.fire('Erreur', err.error?.message || 'Erreur lors de la création', 'error');
        }
      });
  }
}
