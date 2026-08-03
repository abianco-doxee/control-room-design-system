import { For } from "@builder.io/mitosis";
export interface CrTableProps { columns: string[]; rows: string[][]; }
export default function CrTable(props: CrTableProps) {
  return (
    <table class="cr-table">
      <thead>
        <tr><For each={props.columns}>{(col: string) => <th>{col}</th>}</For></tr>
      </thead>
      <tbody>
        <For each={props.rows}>
          {(row: string[]) => (
            <tr><For each={row}>{(cell: string) => <td>{cell}</td>}</For></tr>
          )}
        </For>
      </tbody>
    </table>
  );
}
