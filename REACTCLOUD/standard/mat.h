/******************************************************************************/
/*   MatrixObjects
     This file contains The routines having to do with the BondObjects structures

*/

/*******************************************************************************/
/*   IntegerSquareMatrix
     This is a standard integer matrix
     The Debug form is:

           Size  - The size of the matrix
           Matrix - The matrix itself

*/

typedef struct IntSqrMat {
     INT     Size;
     INT     *Matrix;
     }  IntegerSquareMatrix;
                                              
/****** IntsqrMatSize
*/
#define IntSqrMatSize sizeof(IntegerSquareMatrix)

#define SeqStartIntSqrMat(mat) mat->Matrix
#define SeqNextIntSqrMat(pntr) pntr++;

         
/******************************************************************************/
/* LogicalSquareMatrix
    The Logical Array is a special case of the integer array (contains 1 and 0)

*/

#define LogicalSquareMatrix IntegerSquareMatrix
#define AllocateLogSqrMat   AllocateIntSqrMat
#define AdrLogSqrMat        AdrIntSqrMat 
#define SetLogSqrMat        SetIntSqrMat
#define FullCopyLogSqrMat   FullCopyIntSqrMat
#define PrtLogSqrMat        PrtIntSqrMat
#define SeqStartLogSqrMat   SeqStartIntSqrMat
#define SeqNextLogSqrMat    SeqNextIntSqrMat

/*******************************************************************************/
/* External Matrix Operations */
extern IntegerSquareMatrix *AllocateIntSqrMat(INT Size);
extern INT                 *AdrIntSqrMat(IntegerSquareMatrix *matrix, INT i, INT j);
extern void                SetIntSqrMat(IntegerSquareMatrix *matrix, INT i, INT j, INT value);
extern void                FullCopyIntSqrMat( IntegerSquareMatrix *matrix, IntegerSquareMatrix *pointer );
extern void                PrtIntSqrMat( IntegerSquareMatrix *matrix);
extern void                ZeroIntSqrMat( IntegerSquareMatrix *matrix );                           
extern void FreeIntSqrMat(IntegerSquareMatrix *mat);







