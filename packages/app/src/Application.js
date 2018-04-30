import { settings } from '@pixi/settings';
import { Container } from '@pixi/display';
import { Renderer } from '@pixi/core';

/**
 * Convenience class to create a new PIXI application.
 * This class automatically creates the renderer, ticker
 * and root container.
 *
 * @example
 * // Create the application
 * const app = new PIXI.Application();
 *
 * // Add the view to the DOM
 * document.body.appendChild(app.view);
 *
 * // ex, add display objects
 * app.stage.addChild(PIXI.Sprite.from('something.png'));
 *
 * @class
 * @memberof PIXI
 */
export default class Application
{
    // eslint-disable-next-line valid-jsdoc
    /**
     * @param {object} [options] - The optional renderer parameters
     * @param {boolean} [options.autoStart=true] - automatically starts the rendering after the construction.
     *     Note that setting this parameter to false does NOT stop the shared ticker even if you set
     *     options.sharedTicker to true in case that it is already started. Stop it by your own.
     * @param {number} [options.width=800] - the width of the renderers view
     * @param {number} [options.height=600] - the height of the renderers view
     * @param {HTMLCanvasElement} [options.view] - the canvas to use as a view, optional
     * @param {boolean} [options.transparent=false] - If the render view is transparent, default false
     * @param {boolean} [options.autoDensity=false] - Resizes renderer view in CSS pixels to allow for
     *   resolutions other than 1
     * @param {boolean} [options.antialias=false] - sets antialias (only applicable in chrome at the moment)
     * @param {boolean} [options.preserveDrawingBuffer=false] - enables drawing buffer preservation, enable this if you
     *  need to call toDataUrl on the webgl context
     * @param {number} [options.resolution=1] - The resolution / device pixel ratio of the renderer, retina would be 2
     * @param {boolean} [options.forceCanvas=false] - prevents selection of WebGL renderer, even if such is present
     * @param {number} [options.backgroundColor=0x000000] - The background color of the rendered area
     *  (shown if not transparent).
     * @param {boolean} [options.clearBeforeRender=true] - This sets if the renderer will clear the canvas or
     *   not before the new render pass.
     * @param {boolean} [options.roundPixels=false] - If true PixiJS will Math.floor() x/y values when rendering,
     *  stopping pixel interpolation.
     * @param {boolean} [options.forceFXAA=false] - forces FXAA antialiasing to be used over native.
     *  FXAA is faster, but may not always look as great **webgl only**
     * @param {string} [options.powerPreference] - Parameter passed to webgl context, set to "high-performance"
     *  for devices with dual graphics card **webgl only**
     * @param {boolean} [options.sharedTicker=false] - `true` to use PIXI.Ticker.shared, `false` to create new ticker.
     * @param {boolean} [options.sharedLoader=false] - `true` to use PIXI.Loaders.shared, `false` to create new Loader.
     * @param {boolean} [options.interaction=true] - Set it to `false` to remove interaction.
     * @param {boolean} [options.autoPreventDefault=true] - Should the InteractionManager automatically prevent
     *  default browser actions.
     * @param {number} [options.interactionFrequency=10] - Frequency increases the interaction events
     *  will be checked.
     * @param {Window|HTMLElement} [options.resizeTo] - Element to automatically resize stage to.
     */
    constructor(options, arg2, arg3, arg4, arg5)
    {
        // Support for constructor(width, height, options, noWebGL, useSharedTicker)
        if (typeof options === 'number')
        {
            options = Object.assign({
                width: options,
                height: arg2 || settings.RENDER_OPTIONS.height,
                forceCanvas: !!arg4,
                sharedTicker: !!arg5,
            }, arg3);
        }

        // The default options
        options = Object.assign({
            forceCanvas: false,
        }, options);

        /**
         * WebGL renderer if available, otherwise CanvasRenderer
         * @member {PIXI.Renderer|PIXI.CanvasRenderer}
         */
        this.renderer = this.createRenderer(options);

        /**
         * The root display container that's rendered.
         * @member {PIXI.Container}
         */
        this.stage = new Container();

        // install plugins here
        Application._plugins.forEach((plugin) =>
        {
            plugin.init.call(this, options);
        });
    }

    /**
     * Register a middleware plugin for the application
     * @static
     * @param {PIXI.Application~Plugin} plugin - Plugin being installed
     */
    static registerPlugin(plugin)
    {
        Application._plugins.push(plugin);
    }

    /**
     * Create the new renderer, this is here to overridden to support Canvas.
     *
     * @protected
     * @param {Object} [options] See constructor for complete arguments
     */
    createRenderer(options)
    {
        return new Renderer(options);
    }

    /**
     * Render the current stage.
     */
    render()
    {
        this.renderer.render(this.stage);
    }

    /**
     * Reference to the renderer's canvas element.
     * @member {HTMLCanvasElement}
     * @readonly
     */
    get view()
    {
        return this.renderer.view;
    }

    /**
     * Reference to the renderer's screen rectangle. Its safe to use as filterArea or hitArea for whole screen
     * @member {PIXI.Rectangle}
     * @readonly
     */
    get screen()
    {
        return this.renderer.screen;
    }

    /**
     * Destroy and don't use after this.
     * @param {Boolean} [removeView=false] Automatically remove canvas from DOM.
     */
    destroy(removeView)
    {
        // Destroy plugins in the opposite order
        // which they were constructed
        const plugins = Application._plugins.slice(0);

        plugins.reverse();
        plugins.forEach((plugin) =>
        {
            plugin.destroy.call(this);
        });

        this.stage.destroy();
        this.stage = null;

        this.renderer.destroy(removeView);
        this.renderer = null;

        this._options = null;
    }
}

/**
 * @typedef {object} PIXI.Application~Plugin
 * @property {function} init - Called when Application is constructed, scoped to Application instance.
 *  Passes in `options` as the only argument, which are Application constructor options.
 * @property {function} destroy - Called when destroying Application, scoped to Application instance
 */

/**
 * Collection of installed plugins.
 * @static
 * @private
 * @type {PIXI.Application~Plugin[]}
 */
Application._plugins = [];