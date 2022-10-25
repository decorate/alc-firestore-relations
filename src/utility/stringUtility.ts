
export function snakeToCamel(p: any): any {
    if (p === undefined || typeof (p.replace) !== 'function') return

    return p.replace(/_./g, (s: any) => {
        return s.charAt(1).toUpperCase()
    })
}

export function camelToSnake(p: any): any {
    if (p === undefined || typeof (p.replace) !== 'function') return

    return p.replace(/([A-Z])/g,
        (s: any) => '_' + s.charAt(0).toLowerCase())
}

export function camelCase(str: any){
    str = str.charAt(0).toLowerCase() + str.slice(1);
    return str.replace(/[-_](.)/g, function(match: any, group1: any) {
        return group1.toUpperCase();
    });
}

export function pascalCase(str: any){
    const camel = camelCase(str);
    return camel.charAt(0).toUpperCase() + camel.slice(1);
}

export function toInt(str: any) {
    str = str
        .replace(/[０-９．]/g, function (s: any) {
            return String.fromCharCode(s.charCodeAt(0) - 65248);
        })
        .replace(/[‐－―ー]/g, '')
        .replace(/[^\-\d\.]/g, '')
        .replace(/(?!^\-)[^\d\.]/g, '');
    return parseInt(str, 10);
}

const mixin = <T extends object, U extends object>(
	object: T,
	trait: U,
): Mixin<T, U> =>
	new Proxy(object, {
		get: (target, key) => (trait as any)[key] ?? (target as any)[key],
		has: (target, key) => key in trait || key in target,
	}) as any

type Mixin<T extends object, U extends object> = Omit<T, keyof U> & U