import linq from 'linq'
import { snakeToCamel, camelToSnake } from './stringUtility'

export function objectPush(source, bind) {
    linq.from(source)
        .select(x => {
            if (!bind[x.key]) {
                bind[x.key] = []
            }
            bind[x.key].push(...x.value)
        })
        .toArray()

    const c = linq.from(bind)
        .select(x => {
            return {
                key: x.key,
                value: linq.from(x.value).distinct(xs => xs.id).toArray()
            }
        })
        .toObject('$.key', '$.value')

    return c
}

export function getSelectObject (source) {
    return linq.from(source).select((x, i) => {
        if (!i) {
            return {value:'', text: x}
        }
        return {value: x, text: x}
    }).toArray()
}


/**
 *
 * @param source object {key: param, value: param}
 * @returns {Object}
 * 再帰的にkeyをスネークケースに変換する
 */
export function objectKeyRecursiveCamelToSnake(source) {
    return linq.from(source)
        .where(x => x.value)
        .select(x => {
            const k = camelToSnake(x.key)
            let v = x.value
            if (v.toString().match(/\sObject/)) {
                if (Object.keys(v).length) {
                    v = objectKeyRecursiveCamelToSnake(v)
                } else {
                    return
                }
            }

            if (v.hasOwnProperty('length') && !v.length) {
                return {key: k, value: null}
            }

            return {
                key: k, value: v
            }

        })
        .where(x => x)
        .toObject('$.key', '$.value')
}

/**
 *
 * @param dataSrc | array
 * @param where | function
 */
export function filterAndDestroy(dataSrc, where = (x) => {}) {

    linq.from(dataSrc)
        .select((x, i) => {
            if (where(x)) {
                dataSrc.splice(i, 1)
            }
        })
        .toArray()

}

/**
 * 指定されたkeyでフラット化し返却
 * @param key
 * @param array
 * @returns {any[]}
 */
let arr = []
export function assignKeyFlatten (key, array, recur = false) {

    if (!recur) {
        arr = []
    }

    linq.from(array)
        .select(x => {
            if (x[key].length) {
                assignKeyFlatten(key, x[key], true)
            }

            arr.push(x)
            return x
        })
        .toArray()

    return linq.from(arr).orderBy(x => x.id).toArray()
}

export function getValueByKey(key = '') {
    const noObj = Object.create(null)
    const val = key.split('.')
        .reduce((obj, k) => {
            return defaultValue(obj[k], noObj);
        }, this);

    return noObj === val ? undefined : val
}

export function getValueByKeyFromObj(dataObj, key = '') {
    const noObj = Object.create(null)
    const val = key.split('.')
        .reduce((obj, k) => {
            return defaultValue(obj[k], noObj);
        }, dataObj);

    return noObj === val ? undefined : val
}

export function defaultValue(val, def) {
    return typeof val === 'undefined' ? def : val;
}


/**
 *
 * @param key 更新したいkey
 * @param value 更新する値
 * @param model　更新したい値がモデルの場合指定
 */
export function setValueByKey(key = '', value, model) {
    const noObj = Object.create(null)
    const keys = key.split('.')

    keys.reduce((obj, k, index) => {
        if(index === (keys.length - 1)) {
            if(typeof obj[k] === 'object' && model) {
                console.log(new model({...value}).getPostable())
                obj[k] = new model({...value})
            } else {
                obj[k] = value
            }
        }
        return defaultValue(obj[k], noObj);
    }, this);
}
