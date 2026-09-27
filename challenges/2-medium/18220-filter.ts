/*
  18220 - Filter
  -------
  by Mu-Hun (@mu-hun) #medium #array #filter

  ### Question

  Implement the type `Filter<T, Predicate>`. Here `T` is an array, and `Predicate` is a primitive type or a union of primitive types. The result should be an array that contains only those elements whose types are included in `Predicate`.

  > View on GitHub: https://tsch.js.org/18220
*/

/* _____________ Your Code Here _____________ */

type Filter<T extends any[], P> = []

/* _____________ Test Cases _____________ */
import type { Equal, Expect } from '@type-challenges/utils'

type Falsy = false | 0 | '' | null | undefined

type cases = [
  Expect<Equal<Filter<[0, 1, 2], 2>, [2]>>,
  Expect<Equal<Filter<[0, 1, 2], 0 | 1>, [0, 1]>>,
  Expect<Equal<Filter<[0, 1, 2], Falsy>, [0]>>,
]

/* _____________ Further Steps _____________ */
/*
  > Share your solutions: https://tsch.js.org/18220/answer
  > View solutions: https://tsch.js.org/18220/solutions
  > More Challenges: https://tsch.js.org
*/
