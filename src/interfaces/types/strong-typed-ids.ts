interface Flavoring<F> {
  _type?: F;
}

export type StrongTypedId<T, F> = T & Flavoring<F>;

export type Count = StrongTypedId<number, 'Count'>;
export type RequestId = StrongTypedId<string, 'Request'>;
export type UpdatedAt = StrongTypedId<number, 'UpdatedAt'>;
export type UserId = StrongTypedId<string, 'User'>;
