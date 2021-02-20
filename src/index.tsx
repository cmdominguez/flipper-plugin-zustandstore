import React, { useState } from "react";
import {
  PluginClient,
  usePlugin,
  createState,
  useValue,
  Layout,
} from "flipper-plugin";
import {
  Panel,
  ManagedDataInspector,
  DetailSidebar,
  SearchableTable,
  Text,
  Button,
} from "flipper";

type Data = {
  storeName?: string;
  state?: any;
  title?: string;
  timestamp?: string;
};

type Events = {
  newData: Data;
};

export function plugin(client: PluginClient<Events, {}>) {
  const data = createState<Array<Data>>([]);
  client.onMessage("newData", (newData) => {
    data.update((draft) => {
      draft.push(newData);
    });
  });
  return { data };
}

function renderSidebar(
  row: Data,
  diff: Data | null
) {
  return (
    <Panel floating={false} heading={row.storeName || "Store"}>
      <ManagedDataInspector
        data={row.state}
        expandRoot={true}
        diff={diff?.state}
        collapsed
      />
    </Panel>
  );
}

const columnSizes = {
  time: "30%",
  storeName: "40%",
  action: "30%",
};
const columns = {
  action: {
    value: "Action",
  },
  storeName: {
    value: "Store Name",
  },
  time: {
    value: "Time",
  },
};

const buildRow = (row: Data, i: any) => {
  const copyText = () => JSON.stringify(row);
  // this line is a hack to stay compatible with Flipper <0.46
  copyText.toString = () => JSON.stringify(row);
  const { timestamp } = row;
  const date = new Date(timestamp || "");
  const time =
    date.getHours() +
    ":" +
    date.getMinutes() +
    ":" +
    date.getSeconds() +
    " " +
    date.getMilliseconds() +
    "ms";
  return {
    columns: {
      time: {
        value: <Text>{time}</Text>,
      },
      action: {
        value: <Text>{row.title}</Text>,
        filterValue: row.title,
      },
      storeName: {
        value: <Text>{row.storeName}</Text>,
        filterValue: row.storeName,
      },
    },
    key: i,
    copyText,
    filterValue: `${i}`,
  };
};

function buscador(data: Array<Data>, i: number) {
  const selected = data[i];
  for (let index = i-1; index >= 0; index--) {
    const element = data[index];
    if (element.storeName === selected.storeName) {
      return element;
    }
  }
  return null;
}

export function Component() {
  const instance = usePlugin(plugin);
  const data = useValue(instance.data);
  const [selected, setSelected] = useState<number>(0);
  const rows = data.map((v, i) => buildRow(v, i));
  return (
    <>
      <Layout.ScrollContainer>
        <SearchableTable
          key={100}
          rowLineHeight={28}
          floating={false}
          multiline={true}
          columnSizes={columnSizes}
          columns={columns}
          onRowHighlighted={(e: any) => {
            buscador(data, e[0])  
            setSelected(e[0]);
          }}
          multiHighlight={false}
          rows={rows}
          stickyBottom={true}
          actions={
            <Button
              onClick={() => {
                instance.data.set([]);
              }}
            >
              Clear
            </Button>
          }
        />
      </Layout.ScrollContainer>
      {data.length > 0 && (
        <DetailSidebar>
          {renderSidebar(
            data[selected],
            selected > 0 ? buscador(data, selected) : null
          )}
        </DetailSidebar>
      )}
    </>
  );
}
