import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgFor, NgIf } from '@angular/common';

type RecyclableStatus = 'In Process' | 'Recycled' | 'Pending Collection' | 'Rejected';

interface RecyclableItem {
  id: number;
  name: string;
  quantityKg: number;
  status: RecyclableStatus;
  imageUrl: string;
}

@Component({
  selector: 'app-recyclables-crud',
  standalone: true,
  imports: [FormsModule, NgFor, NgIf],
  template: `
    <section class="crud-card">
      <div class="title-row">
        <h2>Catalogue des produits recyclables</h2>
        <p class="subtitle-hint">Réservé à l’administration — alimente la liste consultée par les flux de valorisation.</p>
      </div>

      <form (ngSubmit)="saveItem()" class="crud-form">
        <div class="form-group">
          <label for="name">Produit recyclable</label>
          <input id="name" name="name" [(ngModel)]="draft.name" required />
        </div>

        <div class="form-group">
          <label for="quantity">Quantite (kg)</label>
          <input
            id="quantity"
            name="quantityKg"
            type="number"
            min="1"
            [(ngModel)]="draft.quantityKg"
            required
          />
        </div>

        <div class="form-group">
          <label for="status">Status</label>
          <select id="status" name="status" [(ngModel)]="draft.status" required>
            <option *ngFor="let status of statuses" [value]="status">
              {{ status }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label for="imageUrl">Image URL</label>
          <input
            id="imageUrl"
            name="imageUrl"
            [(ngModel)]="draft.imageUrl"
            placeholder="https://example.com/recyclable.jpg"
          />
        </div>

        <button type="submit">{{ editingId === null ? 'Add' : 'Update' }}</button>
        <button type="button" class="secondary" *ngIf="editingId !== null" (click)="cancelEdit()">
          Cancel
        </button>
      </form>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Produit</th>
              <th>Image</th>
              <th>Quantite (kg)</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of recyclables">
              <td>{{ item.name }}</td>
              <td>
                <img
                  *ngIf="item.imageUrl"
                  [src]="item.imageUrl"
                  [alt]="item.name"
                  class="thumb"
                />
                <span *ngIf="!item.imageUrl" class="muted">No image</span>
              </td>
              <td>{{ item.quantityKg }}</td>
              <td>{{ item.status }}</td>
              <td class="actions">
                <button type="button" class="secondary" (click)="startEdit(item)">Edit</button>
                <button type="button" class="danger" (click)="deleteItem(item.id)">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  `,
  styles: [`
    .crud-card {
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 14px;
      padding: 1.2rem;
      box-shadow: 0 8px 28px rgba(0, 0, 0, 0.05);
    }

    .title-row h2 {
      margin: 0 0 0.35rem;
      font-size: 1.2rem;
      color: #111827;
    }

    .subtitle-hint {
      margin: 0 0 1rem;
      font-size: 0.88rem;
      color: #6b7280;
    }

    .crud-form {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 0.8rem;
      margin-bottom: 1rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
    }

    input,
    select,
    button {
      border: 1px solid #d1d5db;
      border-radius: 8px;
      padding: 0.5rem 0.6rem;
      font-size: 0.92rem;
    }

    button {
      background: #111827;
      color: #fff;
      cursor: pointer;
      height: fit-content;
      align-self: end;
    }

    button.secondary {
      background: #f3f4f6;
      color: #111827;
    }

    button.danger {
      background: #dc2626;
      color: #fff;
    }

    .table-wrap {
      overflow-x: auto;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    th,
    td {
      text-align: left;
      padding: 0.65rem;
      border-bottom: 1px solid #e5e7eb;
      font-size: 0.9rem;
    }

    .actions {
      display: flex;
      gap: 0.45rem;
    }

    .thumb {
      width: 72px;
      height: 54px;
      object-fit: cover;
      border-radius: 8px;
      border: 1px solid #d1d5db;
      display: block;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }

    .muted {
      color: #6b7280;
      font-size: 0.8rem;
    }
  `]
})
export class RecyclablesCrudComponent {
  private readonly storageKey = 'gestion-receveur-recyclables';
  /** Bump when default catalogue should refresh for all users (local demo). */
  private readonly catalogSeedKey = 'gestion-receveur-recyclables-catalog-seed';
  private readonly catalogSeedValue = 'v3-ten-items';
  protected readonly statuses: RecyclableStatus[] = [
    'In Process',
    'Recycled',
    'Pending Collection',
    'Rejected'
  ];

  protected recyclables: RecyclableItem[] = this.getInitialRecyclables();

  protected draft: Omit<RecyclableItem, 'id'> = {
    name: '',
    quantityKg: 1,
    status: 'In Process',
    imageUrl: ''
  };

  protected editingId: number | null = null;
  private nextId = this.recyclables.length + 1;

  protected saveItem(): void {
    if (!this.draft.name.trim()) {
      return;
    }

    if (this.editingId === null) {
      this.recyclables = [
        ...this.recyclables,
        { id: this.nextId++, ...this.draft, name: this.draft.name.trim() }
      ];
      this.persistRecyclables();
      this.resetForm();
      return;
    }

    this.recyclables = this.recyclables.map((item) =>
      item.id === this.editingId
        ? { ...item, ...this.draft, name: this.draft.name.trim() }
        : item
    );
    this.persistRecyclables();
    this.cancelEdit();
  }

  protected startEdit(item: RecyclableItem): void {
    this.editingId = item.id;
    this.draft = {
      name: item.name,
      quantityKg: item.quantityKg,
      status: item.status,
      imageUrl: item.imageUrl
    };
  }

  protected cancelEdit(): void {
    this.editingId = null;
    this.resetForm();
  }

  protected deleteItem(id: number): void {
    this.recyclables = this.recyclables.filter((item) => item.id !== id);
    this.persistRecyclables();
    if (this.editingId === id) {
      this.cancelEdit();
    }
  }

  private resetForm(): void {
    this.draft = {
      name: '',
      quantityKg: 1,
      status: 'In Process',
      imageUrl: ''
    };
  }

  private getInitialRecyclables(): RecyclableItem[] {
    const seedOk = localStorage.getItem(this.catalogSeedKey) === this.catalogSeedValue;
    const cached = localStorage.getItem(this.storageKey);
    if (seedOk && cached) {
      try {
        const parsed = JSON.parse(cached) as RecyclableItem[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch {
        localStorage.removeItem(this.storageKey);
      }
    }

    const defaults: RecyclableItem[] = [
      {
        id: 1,
        name: 'Épluchures & déchets verts',
        quantityKg: 120,
        status: 'In Process',
        imageUrl:
          'https://images.unsplash.com/photo-1464226184884-fa280b87c799?auto=format&fit=crop&w=400&q=80'
      },
      {
        id: 2,
        name: 'Marc de café & filtres',
        quantityKg: 35,
        status: 'Pending Collection',
        imageUrl:
          'https://images.unsplash.com/photo-1447933601403-0c6688de94e5?auto=format&fit=crop&w=400&q=80'
      },
      {
        id: 3,
        name: 'Pelures de fruits & restes de cuisine',
        quantityKg: 88,
        status: 'Recycled',
        imageUrl:
          'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=400&q=80'
      },
      {
        id: 4,
        name: 'Cartons alimentaires propres',
        quantityKg: 210,
        status: 'In Process',
        imageUrl:
          'https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=400&q=80'
      },
      {
        id: 5,
        name: 'Bouteilles PET compressées',
        quantityKg: 95,
        status: 'Pending Collection',
        imageUrl:
          'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=400&q=80'
      },
      {
        id: 6,
        name: 'Bocaux & verre alimentaire',
        quantityKg: 64,
        status: 'In Process',
        imageUrl:
          'https://images.unsplash.com/photo-1585123334904-845d60e97b29?auto=format&fit=crop&w=400&q=80'
      },
      {
        id: 7,
        name: 'Films & emballages souples',
        quantityKg: 42,
        status: 'Rejected',
        imageUrl:
          'https://images.unsplash.com/photo-1532996122764-b3b103b2bec8?auto=format&fit=crop&w=400&q=80'
      },
      {
        id: 8,
        name: 'Coquilles & coquillages (broyés)',
        quantityKg: 28,
        status: 'Recycled',
        imageUrl:
          'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=400&q=80'
      },
      {
        id: 9,
        name: 'Papier journal & carton ondulé',
        quantityKg: 156,
        status: 'Pending Collection',
        imageUrl:
          'https://images.unsplash.com/photo-1503602642458-232111445752?auto=format&fit=crop&w=400&q=80'
      },
      {
        id: 10,
        name: 'Invendus pain & farines',
        quantityKg: 72,
        status: 'In Process',
        imageUrl:
          'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80'
      }
    ];
    localStorage.setItem(this.catalogSeedKey, this.catalogSeedValue);
    localStorage.setItem(this.storageKey, JSON.stringify(defaults));
    return defaults;
  }

  private persistRecyclables(): void {
    localStorage.setItem(this.storageKey, JSON.stringify(this.recyclables));
  }
}
