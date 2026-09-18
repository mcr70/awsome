import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface SidebarPreference {
  id: string;
  label: string;
  route: string;
  visible: boolean;
}

const defaultSidebarPreferences: SidebarPreference[] = [
  { id: 'codecommit', label: 'CodeCommit', route: '/codecommit', visible: true },
  { id: 'cloudwatch', label: 'CloudWatch', route: '/cloudwatch', visible: true },
  { id: 'cloudfront', label: 'CloudFront', route: '/cloudfront', visible: true },
  { id: 'ecs', label: 'ECS', route: '/ecs', visible: true },
  { id: 'elb', label: 'ELB', route: '/elb', visible: true },
  { id: 'rds', label: 'RDS', route: '/rds', visible: true },
  { id: 'billing', label: 'Billing', route: '/billing', visible: true }
];

@Injectable({ providedIn: 'root' })
export class PreferencesService {
  private readonly storageKey = 'awsome.sidebar-preferences';
  private readonly preferencesSubject = new BehaviorSubject<SidebarPreference[]>(this.load());

  readonly preferences$ = this.preferencesSubject.asObservable();

  get preferences(): SidebarPreference[] {
    return this.preferencesSubject.value;
  }

  setVisible(id: string, visible: boolean): void {
    this.update(this.preferences.map((item) => item.id === id ? { ...item, visible } : item));
  }

  move(fromIndex: number, toIndex: number): void {
    const items = [...this.preferences];
    const [moved] = items.splice(fromIndex, 1);
    items.splice(toIndex, 0, moved);
    this.update(items);
  }

  reset(): void {
    this.update(this.defaultPreferences());
  }

  private update(preferences: SidebarPreference[]): void {
    this.preferencesSubject.next(preferences);
    localStorage.setItem(this.storageKey, JSON.stringify(preferences));
  }

  private load(): SidebarPreference[] {
    const defaults = this.defaultPreferences();

    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) {
        return defaults;
      }

      const saved = JSON.parse(stored) as Partial<SidebarPreference>[];
      const known = new Map(defaults.map((item) => [item.id, item]));
      const restored = saved.flatMap((item) => {
        if (typeof item.id !== 'string') {
          return [];
        }

        const defaultItem = known.get(item.id);
        return defaultItem ? [{ ...defaultItem, visible: item.visible !== false }] : [];
      });
      const missing = defaults.filter((item) => !restored.some((savedItem) => savedItem.id === item.id));

      return [...restored, ...missing];
    } catch {
      return defaults;
    }
  }

  private defaultPreferences(): SidebarPreference[] {
    return defaultSidebarPreferences.map((item) => ({ ...item }));
  }
}
