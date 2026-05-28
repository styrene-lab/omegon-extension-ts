/**
 * Core types for the omegon extension protocol.
 * Zero dependencies — Node.js stdlib only.
 *
 * v2 protocol: numeric error codes, capabilities, bidirectional messaging.
 */
/** RPC error codes — JSON-RPC 2.0 numeric codes with string labels. */
export var ErrorCode;
(function (ErrorCode) {
    // JSON-RPC 2.0 standard
    ErrorCode[ErrorCode["ParseError"] = -32700] = "ParseError";
    ErrorCode[ErrorCode["InvalidRequest"] = -32600] = "InvalidRequest";
    ErrorCode[ErrorCode["MethodNotFound"] = -32601] = "MethodNotFound";
    ErrorCode[ErrorCode["InvalidParams"] = -32602] = "InvalidParams";
    ErrorCode[ErrorCode["InternalError"] = -32603] = "InternalError";
    // Omegon extension codes
    ErrorCode[ErrorCode["Timeout"] = -32000] = "Timeout";
    ErrorCode[ErrorCode["NotImplemented"] = -32001] = "NotImplemented";
    ErrorCode[ErrorCode["ManifestError"] = -32002] = "ManifestError";
    ErrorCode[ErrorCode["VersionMismatch"] = -32003] = "VersionMismatch";
    ErrorCode[ErrorCode["Cancelled"] = -32004] = "Cancelled";
    ErrorCode[ErrorCode["ResourceNotFound"] = -32005] = "ResourceNotFound";
    ErrorCode[ErrorCode["SamplingDenied"] = -32006] = "SamplingDenied";
})(ErrorCode || (ErrorCode = {}));
/** Map from numeric code to string label. */
const ERROR_LABELS = {
    [-32700]: "ParseError",
    [-32600]: "InvalidRequest",
    [-32601]: "MethodNotFound",
    [-32602]: "InvalidParams",
    [-32603]: "InternalError",
    [-32000]: "Timeout",
    [-32001]: "NotImplemented",
    [-32002]: "ManifestError",
    [-32003]: "VersionMismatch",
    [-32004]: "Cancelled",
    [-32005]: "ResourceNotFound",
    [-32006]: "SamplingDenied",
};
/** Get the string label for an error code. */
export function errorLabel(code) {
    return ERROR_LABELS[code] ?? `Error${code}`;
}
/** JSON-RPC error response. */
export class RpcError extends Error {
    code;
    data;
    constructor(code, message, data) {
        super(message);
        this.code = code;
        this.data = data;
        this.name = "RpcError";
    }
    toJSON() {
        return {
            code: this.code,
            label: errorLabel(this.code),
            message: this.message,
            data: this.data ?? null,
        };
    }
    static methodNotFound(method) {
        return new RpcError(ErrorCode.MethodNotFound, `method '${method}' not found`);
    }
    static invalidParams(reason) {
        return new RpcError(ErrorCode.InvalidParams, reason);
    }
    static internalError(reason) {
        return new RpcError(ErrorCode.InternalError, reason);
    }
    static notImplemented(method) {
        return new RpcError(ErrorCode.NotImplemented, `method '${method}' not implemented`);
    }
    static cancelled() {
        return new RpcError(ErrorCode.Cancelled, "request was cancelled");
    }
}
//# sourceMappingURL=types.js.map