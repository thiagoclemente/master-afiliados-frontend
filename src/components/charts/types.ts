export interface ChartPayload {
  name: string;
  value: number;
  payload: {
    name: string;
    value: number;
    pedidos?: number;
    comissao?: number;
    cliques?: number;
    percentual?: number;
    fullName?: string;
    color?: string;
  };
}

export interface TooltipProps {
  active?: boolean;
  payload?: ChartPayload[];
  label?: string;
}

export interface LegendProps {
  payload?: Array<{
    value: string;
    color: string;
  }>;
}
