import { Pipe, PipeTransform } from '@angular/core';

/**
 * Usage: {{ array | filterCount:'fieldName':'value' }}
 * Returns the count of items in an array where item[field] === value
 */
@Pipe({ name: 'filterCount', standalone: true })
export class FilterCountPipe implements PipeTransform {
  transform(items: any[], field: string, value: any): number {
    if (!items || !field) return 0;
    return items.filter(item => item[field] === value).length;
  }
}
