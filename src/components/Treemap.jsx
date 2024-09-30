import { useEffect, useRef, forwardRef, useImperativeHandle, useState } from 'react';
import { gloperate, initialize } from 'treemap';

import {
  Configuration,
  Navigation,
  Renderer,
  Visualization,
} from 'treemap';


const Treemap = forwardRef(({ config }, ref) => {
  const renderer = useRef(null);
  const canvas = useRef(null);
  const visualization = useRef(null);

  function initTreemap() {
    // This is a workaround to get the Treemap library to look for the font files in the right place
    window.SeereneConstants = {
      STATIC_DIRECTORY: `${import.meta.env.BASE_URL}assets`,
    };

    visualization.current = new Visualization();
    renderer.current = visualization.current.renderer;

    const html_canvas = document.getElementById("treemapCanvas");
    canvas.current = initialize(html_canvas);
    canvas.current.renderer = renderer.current;

    visualization.current.configuration = config;
  }

  function changeMapping(mapping) {
    visualization.current.configuration.geometry.leafLayers[0].height = `bufferView:${mapping.height}`;
    visualization.current.configuration.geometry.leafLayers[0].colors = `bufferView:${mapping.colors}`;
    visualization.current.configuration.altered.alter("geometry");
    // visualization.current.configuration.altered.alter("labels");

    renderer.current.invalidate();
  }

  function highlightNode(highlight) {
    const nodes = highlight.map(nodeIdx => visualization.current.configuration.filenameToIndex.get(nodeIdx));

    const emphasis = visualization.current.configuration.geometry.emphasis;
    emphasis.highlight = nodes;

    visualization.current.configuration.altered.alter("geometry.emphasis.highlight");
    renderer.current.invalidate();
  }

  useEffect(() => {
    if (renderer.current === null) {
      initTreemap();
    }

    renderer.current.invalidate();

    // return () => {
    //   canvas.current.dispose();
    //   renderer.current.uninitialize();
    // };
  }, [config]); // config as dep?

  useImperativeHandle(ref, () => ({
    changeMapping: changeMapping,
    highlightNode: highlightNode
  }));

  return (
    <>
      <canvas id="treemapCanvas" width={"400"} height={"250"} />
    </>
  );
})

export default Treemap;