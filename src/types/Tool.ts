export interface Tool {
  name: string;
  description: string;
  function: (args: any) => Promise<any>;
  parameters?: any[];
}
