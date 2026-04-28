import { RouterLink, RouterLinkActive } from '@angular/router';
import { Component, ViewEncapsulation, OnDestroy, ChangeDetectorRef, NgZone, OnInit } from '@angular/core';
import { Router } from '@angular/router';
//import { io, Socket } from 'socket.io-client';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnDestroy, OnInit {
  //private socket: any = Socket;
  connectedUsers: any;
  subscriptionData:any=null;
  unreadCount: number = 0;
  dropdownOpen: boolean = false;
  groupedNotifications: { [key: string]: any[] } = {}; // To hold notifications grouped by date

  // Getter to return the keys of the groupedNotifications object
  get notificationDates(): string[] {
    return Object.keys(this.groupedNotifications);
  }

  // Track expanded state of each section

expandedSections: { [key: string]: boolean } = {
  restaurantManagement: true,
  stockManagement: true,
  Statistics: true
};

  constructor(
    private cdr: ChangeDetectorRef,
    private router: Router,
    private zone: NgZone
  ) {
  }




  isExpired: boolean = false;

  ngOnInit() {



  }

  ngOnDestroy() {

  }





  isRouteActive(route: string): boolean {
    return this.router.isActive(route, true);
  }

  // Notification methods

 toggleDropdown() {
  this.dropdownOpen = !this.dropdownOpen;
  this.unreadCount = 0;



}







  showSweetAlert() {
    const swalWithBootstrapButtons = Swal.mixin({
      customClass: {
        confirmButton: "btn btn-success confirmBtn",
        cancelButton: "btn btn-danger"
      },
    });

    swalWithBootstrapButtons.fire({
      title: "Déconnexion",
      text: "Êtes-vous sûr(e) ?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#101d2d",
      cancelButtonColor: "#d33",
      confirmButtonText: "Se déconnecter",
      cancelButtonText: "Annuler",
    }).then((result) => {
      if (result.isConfirmed) {
        console.log('logout');
      }
    });
  }

  toggleSection(section: string) {
    // Toggle only the clicked section's visibility
    this.expandedSections[section] = !this.expandedSections[section];
  }

  // Add this method to check if a section is expanded
  isSectionExpanded(section: string): boolean {
    return this.expandedSections[section];
  }


  /**notifs popup */
  isNotifPopupOpen: boolean = false;


  openNotifPopup() {
    this.isNotifPopupOpen = true;
    this.toggleDropdown();

  }



  closeNotifPopup() {
    this.isNotifPopupOpen = false;
  }

  filteredNotifications: any[] = []; // Separate array for filtered notifications

  get isTransporter(): boolean {
    return this.router.url.startsWith('/transporter');
  }

  private transporterLinks = [
    { label: 'Mes livraisons', icon: 'fa-solid fa-route', route: '/transporter/mes-livraisons', exact: false },
    { label: 'Calendrier', icon: 'fa-regular fa-calendar-days', route: '/transporter/calendrier', exact: false }
  ];

  private deliveryCompanyLinks = [
    { label: 'Demandes de livraison', icon: 'fa-solid fa-list-check', route: '/delivery-company/delivery-requests', exact: false },
    { label: 'Gestion véhicules', icon: 'fa-solid fa-truck', route: '/delivery-company/vehicles', exact: true },
    { label: 'Gestion transporteurs', icon: 'fa-solid fa-users', route: '/delivery-company/transporters', exact: false }
  ];

  get navLinks() {
    return this.isTransporter ? this.transporterLinks : this.deliveryCompanyLinks;
  }

  get profileRoute() {
    return this.isTransporter ? null : '/delivery-company/profile';
  }
}
