export const objectsEqualShallow = (obj1: object, obj2: object) => {
    if (obj1 === obj2) {
        return true;
    }

    if (Object.keys(obj1).length !== Object.keys(obj2).length) {
        return false;
    }

    return (Object.keys(obj1) as (keyof typeof obj1)[]).every((key) => (Object.prototype.hasOwnProperty.call(obj2, key) && obj1[key] === obj2[key]));
};
