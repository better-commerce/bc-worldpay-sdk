import { createHash, createHmac, timingSafeEqual } from "crypto";
import { Defaults } from "../constants";

export const md5 = (value: string): string => createHash("md5").update(value, "utf8").digest("hex");

export const hmacSha256 = (secret: string, value: string): string => createHmac("sha256", secret).update(value, "utf8").digest("hex");

/**
 * Compares two strings in constant time.
 */
export const safeEqual = (a: string, b: string): boolean => {
    const left = Buffer.from(a);
    const right = Buffer.from(b);
    return left.length === right.length && timingSafeEqual(left, right);
}

export const isAbsoluteUrl = (value: string): boolean => /^https?:\/\//i.test(value || Defaults.String.Value);

export const stringToBoolean = (value: any): boolean => {
    if (typeof value === "boolean") {
        return value;
    }
    return ["true", "1", "yes"].includes(String(value ?? Defaults.String.Value).trim().toLowerCase());
}
