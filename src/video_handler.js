import '../assets/turning_red.mp4';

export class VideoHandler {
    constructor({gl, video, program, positionsBuffer, attributes, uniforms, verticesIndexBuffer, texture}) {
        this.gl = gl;
        this.video = video;
        this.program = program;
        this.positionsBuffer = positionsBuffer;
        this.attributes = attributes;
        this.uniforms = uniforms;
        this.verticesIndexBuffer = verticesIndexBuffer;
        this.texture = texture;
    }

    init({videoTimerCallback}) {
        const self = this;

        this.video.addEventListener("play", function () {
            self.width = self.video.width;
            self.height = self.video.height;
            self.timerCallback({videoTimerCallback: videoTimerCallback});
        }, false);
    }

    displayFrame() {
        // video is ready (can display pixels)
        if (this.video.readyState >= 3) {
            this.updateTexture(); // update pixels with current video frame's pixels

            this.gl.useProgram(this.program);

            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionsBuffer);
            this.gl.vertexAttribPointer(this.attributes['aVertexPosition'], 2, this.gl.FLOAT, false, 0, 0);

            //# Specify the texture to map onto the faces.
            this.gl.activeTexture(this.gl.TEXTURE0);
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
            this.gl.uniform1i(this.uniforms['uSampler'], 0);

            //# Draw GPU
            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.verticesIndexBuffer);
            this.gl.drawElements(this.gl.TRIANGLES, 6, this.gl.UNSIGNED_SHORT, 0);
        }
    }

    timerCallback({videoTimerCallback}) {
        if (this.video.paused || this.video.ended) {
            return;
        }

        videoTimerCallback();

        let self = this;
        setTimeout(function () {
            self.timerCallback({videoTimerCallback: videoTimerCallback});
        }, 0);
    }

    // update the texture from the video
    updateTexture() {
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
        this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);

        //# next line fails in Safari if input video is NOT from same domain/server as this html code
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGB, this.gl.RGB, this.gl.UNSIGNED_BYTE, this.video);
        this.gl.bindTexture(this.gl.TEXTURE_2D, null);
    }
}