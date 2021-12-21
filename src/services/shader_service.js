class ShaderService {
    getShaderById(id, gl) {
        const shaderScript = document.getElementById(id);

        let theSource = "";
        let currentChild = shaderScript.firstChild;

        while (currentChild) {
            if (currentChild.nodeType === 3) {
                theSource += currentChild.textContent;
            }
            currentChild = currentChild.nextSibling;
        }

        let result;

        if (shaderScript.type === "x-shader/x-fragment") {
            result = gl.createShader(gl.FRAGMENT_SHADER);
        } else {
            result = gl.createShader(gl.VERTEX_SHADER);
        }

        gl.shaderSource(result, theSource);
        gl.compileShader(result);

        if (!gl.getShaderParameter(result, gl.COMPILE_STATUS)) {
            alert("An error occurred compiling the shaders: " + gl.getShaderInfoLog(result));
            return null;
        }
        return result;
    }
}

export const shaderService = new ShaderService();