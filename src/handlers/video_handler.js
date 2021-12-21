import '../../assets/turning_red.mp4';
import {shaderService} from '../services/shader_service';

export class VideoHandler {
    constructor({gl, video}) {
        this.gl = gl;
        this.video = video;

        this.program = null;
        this.positionsBuffer = null;
        this.attributes = {};
        this.uniforms = {};
        this.verticesIndexBuffer = null;
        this.texture = null;
    }

    initTimerCallback({videoTimerCallback}) {
        this._initShader();

        const self = this;

        this.video.addEventListener("play", function () {
            self.width = self.video.width;
            self.height = self.video.height;
            self._timerCallback({videoTimerCallback: videoTimerCallback});
        }, false);
    }

    displayFrame() {
        // video is ready (can display pixels)
        if (this.video.readyState >= 3) {
            // update pixels with current video frame's pixels
            this._updateTexture();

            this.gl.useProgram(this.program);

            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionsBuffer);
            this.gl.vertexAttribPointer(this.attributes['aVertexPosition'], 2, this.gl.FLOAT, false, 0, 0);

            // Specify the texture to map onto the faces.
            this.gl.activeTexture(this.gl.TEXTURE0);
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
            this.gl.uniform1i(this.uniforms['uSampler'], 0);

            // Draw
            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.verticesIndexBuffer);
            this.gl.drawElements(this.gl.TRIANGLES, 6, this.gl.UNSIGNED_SHORT, 0);
        }
    }

    _timerCallback({videoTimerCallback}) {
        if (this.video.paused || this.video.ended) {
            return;
        }

        videoTimerCallback();

        let self = this;
        setTimeout(function () {
            self._timerCallback({videoTimerCallback: videoTimerCallback});
        }, 0);
    }

    // update the texture from the video
    _updateTexture() {
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
        this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);

        // next line fails in Safari if input video is NOT from same domain/server as this html code
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGB, this.gl.RGB, this.gl.UNSIGNED_BYTE, this.video);
        this.gl.bindTexture(this.gl.TEXTURE_2D, null);
    }

    _initShader() {
        this._attachShader({
            fragmentShaderName: 'shader-fs',
            vertexShaderName: 'shader-vs',
            attributes: ['aVertexPosition'],
            uniforms: ['someVal', 'uSampler'],
        });

        this.gl.clearColor(0.0, 0.0, 0.0, 0.0);
        this.gl.clearDepth(1.0);
        this.gl.disable(this.gl.DEPTH_TEST);

        this.positionsBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionsBuffer);

        const positions = [-1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0,];
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.STATIC_DRAW);

        this.verticesIndexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.verticesIndexBuffer);

        const vertexIndices = [0, 1, 2, 0, 2, 3,];

        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(vertexIndices), this.gl.STATIC_DRAW);

        this.texture = this.gl.createTexture();

        this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);

        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    }

    _attachShader(params) {
        this.fragmentShader = shaderService.getShaderById(params.fragmentShaderName, this.gl);
        this.vertexShader = shaderService.getShaderById(params.vertexShaderName, this.gl);

        this.program = this.gl.createProgram();
        this.gl.attachShader(this.program, this.vertexShader);
        this.gl.attachShader(this.program, this.fragmentShader);

        this.gl.linkProgram(this.program);

        if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
            alert("Unable to initialize the shader program: " + this.gl.getProgramInfoLog(this.program));
        }

        this.gl.useProgram(this.program);

        this._handleAttributesAndUniforms({uniforms: params.uniforms, attributes: params.attributes});
    }

    // get the location of attributes and uniforms
    _handleAttributesAndUniforms({uniforms, attributes}) {
        for (let i = 0; i < attributes.length; i++) {
            const attributeName = attributes[i];
            this.attributes[attributeName] = this.gl.getAttribLocation(this.program, attributeName);
            this.gl.enableVertexAttribArray(this.attributes[attributeName]);
        }

        for (let i = 0; i < uniforms.length; i++) {
            const uniformName = uniforms[i];
            this.uniforms[uniformName] = this.gl.getUniformLocation(this.program, uniformName);

            this.gl.enableVertexAttribArray(this.attributes[uniformName]);
        }
    }
}