declare namespace React {
  type ReactNode = any;
  type ElementType = any;
  interface CSSProperties { [key: string]: any }
  interface ButtonHTMLAttributes<T> extends Record<string, any> {}
  interface InputHTMLAttributes<T> extends Record<string, any> {}
  interface TextareaHTMLAttributes<T> extends Record<string, any> {}
  interface LabelHTMLAttributes<T> extends Record<string, any> {}
  interface ChangeEvent<T = any> { target: T; }
}
declare namespace JSX { interface IntrinsicElements { [elemName: string]: any; } }
declare module 'react' {
  export = React;
  export const useEffect: any;
  export const useMemo: any;
  export const useRef: any;
  export const useState: any;
  export type ChangeEvent<T = any> = React.ChangeEvent<T>;
}
declare module 'next' {
  export type Metadata = any;
  export type Viewport = any;
}
declare module 'next/navigation' { export const useRouter: any; }
declare module 'lucide-react' { export const PlusCircle:any; export const Image:any; export const Smile:any; export const Mic:any; export const SendHorizontal:any; export const Settings2:any; export const Palette:any; export const Clock3:any; export const UserCircle2:any; export const MessageSquareMore:any; export const Trash2:any; export const X:any; export const Phone:any; export const Video:any; export const PhoneOff:any; }
