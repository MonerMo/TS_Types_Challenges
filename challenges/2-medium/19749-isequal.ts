/*
  19749 - IsEqual
  -------
  by Takahiro Kato (@doz13189) #medium #utils

  ### Question

  Implements the equal operator that returns a boolean for whether the two given types are equal.

  For example:

  ```ts
  type X1 = 1
  type Y1 = 1
  type T1 = IsEqual<X1, Y1> // expected to be true

  type X2 = 1
  type Y2 = 2
  type T2 = IsEqual<X2, Y2> // expected to be false
  ```

  > View on GitHub: https://tsch.js.org/19749
*/

/* _____________ Your Code Here _____________ */

type IsEqual<X, Y> = any

/* _____________ Test Cases _____________ */
import type { Equal, Expect } from '@type-challenges/utils'

type cases = [
  Expect<Equal<IsEqual<number, string>, false>>,
  Expect<Equal<IsEqual<1, 1>, true>>,
  Expect<Equal<IsEqual<any, 1>, false>>,
  Expect<Equal<IsEqual<1 | 2, 1>, false>>,
  Expect<Equal<IsEqual<any, never>, false>>,
  Expect<Equal<IsEqual<[any], [number]>, false>>,
]

/* _____________ Further Steps _____________ */
/*
  > Share your solutions: https://tsch.js.org/19749/answer
  > View solutions: https://tsch.js.org/19749/solutions
  > More Challenges: https://tsch.js.org
*/
