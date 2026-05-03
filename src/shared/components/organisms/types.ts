export type HeaderProps = {
  title?: string;
  onMenuPress?: () => void;
  onSearchPress?: () => void;
};

export type MenuItemType = {
  id: number;
  label: string;
  icon: string;
  screenName: string;
};

export type StatusType = 'success' | 'caution' | 'warning' | 'danger';

export interface CustomProgressProps {
  value: number;
  color?: string;
  style?: any;
}
