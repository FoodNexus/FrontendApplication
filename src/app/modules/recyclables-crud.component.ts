import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgFor, NgIf } from '@angular/common';

type RecyclableStatus = 'In Process' | 'Recycled' | 'Pending Collection' | 'Rejected';

interface RecyclableItem {
  id: number;
  name: string;
  quantityKg: number;
  status: RecyclableStatus;
}

@Component({
  selector: 'app-recyclables-crud',
  standalone: true,
  imports: [FormsModule, NgFor, NgIf],
  template: `
    <section class="crud-card">
      <div class="title-row">
        <h2>Gestion Receveur - Recyclables</h2>
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
              <th>Quantite (kg)</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of recyclables">
              <td>{{ item.name }}</td>
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
      margin: 0 0 1rem;
      font-size: 1.2rem;
      color: #111827;
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
  `]
})
export class RecyclablesCrudComponent {
  protected readonly statuses: RecyclableStatus[] = [
    'In Process',
    'Recycled',
    'Pending Collection',
    'Rejected'
  ];

  protected recyclables: RecyclableItem[] = [
    { id: 1, name: 'Plastic bottles', quantityKg: 45, status: 'In Process' },
    { id: 2, name: 'Cardboard', quantityKg: 30, status: 'Recycled' }
  ];

  protected draft: Omit<RecyclableItem, 'id'> = {
    name: '',
    quantityKg: 1,
    status: 'In Process'
  };

  protected editingId: number | null = null;
  private nextId = 3;

  protected saveItem(): void {
    if (!this.draft.name.trim()) {
      return;
    }

    if (this.editingId === null) {
      this.recyclables = [
        ...this.recyclables,
        { id: this.nextId++, ...this.draft, name: this.draft.name.trim() }
      ];
      this.resetForm();
      return;
    }

    this.recyclables = this.recyclables.map((item) =>
      item.id === this.editingId
        ? { ...item, ...this.draft, name: this.draft.name.trim() }
        : item
    );
    this.cancelEdit();
  }

  protected startEdit(item: RecyclableItem): void {
    this.editingId = item.id;
    this.draft = {
      name: item.name,
      quantityKg: item.quantityKg,
      status: item.status
    };
  }

  protected cancelEdit(): void {
    this.editingId = null;
    this.resetForm();
  }

  protected deleteItem(id: number): void {
    this.recyclables = this.recyclables.filter((item) => item.id !== id);
    if (this.editingId === id) {
      this.cancelEdit();
    }
  }

  private resetForm(): void {
    this.draft = {
      name: '',
      quantityKg: 1,
      status: 'In Process'
    };
  }
}
