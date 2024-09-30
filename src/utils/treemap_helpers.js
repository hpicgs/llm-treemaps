// This file is adapted from https://github.com/hpicgs/github-software-analytics-embedding/blob/dev/frontend/src/utils/treemap_helpers.ts
import { Configuration } from "treemap"


export function createFileTree(rows) {
  const rootNode = {
    name: "/",
    children: []
  }
  rows.forEach(row => {
    const filenames = row.filename.replace("./", "").split("/")
    filenames.reduce((r, name) => {
      if (!r.children.find(c => c.name === name)) {
        const child = {
          name,
          filename: row.filename,
          children: []
        }
        if (name === filenames[filenames.length - 1]) {
          child.metrics = row
        }
        r.children.push(child)
      }
      return r.children.find(c => c.name === name)
    }, rootNode)
  })

  console.log(rootNode)
  if (rootNode.children.length === 1) {
    return rootNode.children[0]
  }

  return rootNode
}

export function configFromFileTree(
  fileTreeRoot,
  variableNames = ["loc", "noc", "cloc", "dc", "nof"]
) {
  const config = new Configuration()

  const edges = []
  const names = new Map()
  const filenameToIndex = new Map()

  const variables = Object.fromEntries(variableNames.map(name => [name, [0]]))

  function buildEdges(node, parent = 0) {
    const index = edges.length + 1
    names.set(index, node.name)
    filenameToIndex.set(node.filename, index)
    edges.push([parent, index])
    if (node.metrics) {
      variableNames.forEach(name => {
        variables[name].push(node.metrics[name])
      });
    } else {
      variableNames.forEach(name => {
        variables[name].push(0)
      });
    }
    node.children.forEach(child => {
      buildEdges(child, index)
    })
  }
  buildEdges(fileTreeRoot)

  console.log("names", names)
  console.log("edges", edges)
  console.log("variables", variables)

  config.topology = {
    edges,
    format: "tupled"
  }

  const buffers = [
    {
      identifier: "source-null",
      type: "numbers",
      data: new Array(names.size + 1).fill(0),
      linearization: "topology"
    }
  ]
  variableNames.forEach(name => {
    buffers.push({
      identifier: `source-${name}`,
      type: "numbers",
      data: variables[name],
      linearization: "topology"
    })
  });
  config.buffers = buffers;

  const bufferViews = [
    {
      identifier: "weights",
      source: "buffer:source-loc",
      transformations: [
        { type: "fill-invalid", value: 0.0, invalidValue: -1.0 },
        { type: "propagate-up", operation: "sum" }
      ]
    }
  ]
  variableNames.forEach(name => {
    bufferViews.push({
      identifier: name,
      source: `buffer:source-${name}`,
      transformations: [
        { type: "fill-invalid", value: 0.0, invalidValue: -1.0 },
        { type: "normalize", operation: "zero-to-max" }
      ]
    })
  });
  config.bufferViews = bufferViews;

  config.colors = [
    { identifier: "emphasis", space: "hex", value: "#00b0ff" },
    { identifier: "auxiliary", space: "hex", values: ["#00aa5e", "#71237c"] },
    { identifier: "inner", space: "hex", values: ["#e8eaee", "#eef0f4"] },
    {
      identifier: "leaf",
      space: "hex",
      values: [
        "#d73027",
        "#fc8d59",
        "#fee090",
        "#ffffbf",
        "#e0f3f8",
        "#91bfdb",
        "#4575b4"
      ]
    }
  ]

  config.layout = {
    algorithm: "snake",
    weight: "bufferView:weights",
    sort: {
      key: "bufferView:weights",
      algorithm: "keep"
    },
    parentPadding: { type: "relative", value: 0.05 },
    siblingMargin: { type: "relative", value: 0.05 },
    accessoryPadding: {
      type: "absolute",
      direction: "bottom",
      value: [0.0, 0.02, 0.01, 0.0],
      relativeAreaThreshold: 0.4,
      targetAspectRatio: 8.0
    }
  }

  config.geometry = {
    parentLayer: { showRoot: false },
    leafLayers: [
      {
        colorMap: "color:leaf",
        height: "buffer:source-null",
        // colors: "buffer:source-null"
      },
      {
        colorMap: "color:leaf",
        height: "buffer:source-null",
        // colors: "buffer:source-null"
      }
    ],
    emphasis: { outline: new Array(), highlight: new Array() },
    heightScale: 0.5
  }

  config.labels = {
    innerNodeLayerRange: [0, 4],
    numTopInnerNodes: 6,
    numTopWeightNodes: 6,
    numTopHeightNodes: 6,
    numTopColorNodes: 6
  }

  // config.labels.callback = (idsToLabel, callback) => callback(names)

  config.altered.alter("labels")

  config.filenameToIndex = filenameToIndex;

  // console.log("Config", JSON.stringify(config, null, 2))
  return config
}
