/*****************************************************************************/
/*  Matrix-Operations Routines*/

#include "basic.h"
#include "mat.h"

/****** AllocateIntSqrMat 
     This routine allocates the structure and the array */
IntegerSquareMatrix *AllocateIntSqrMat(INT Size) 
     {
     IntegerSquareMatrix *pointer;      
     
     pointer = (IntegerSquareMatrix *) Malloc(IntSqrMatSize);
     pointer->Matrix = AllocArrayINT(Size*Size);
     pointer->Size   = Size;
     
     return(pointer);
     };
extern void FreeIntSqrMat(IntegerSquareMatrix *mat)
     {
     Free(mat->Matrix);
     Free(mat);
     }

/****** AdrIntSqrMat
     This routine returns the address of the matrix element(i,j) 
*/
INT *AdrIntSqrMat(IntegerSquareMatrix *matrix, INT i, INT j)
{
     if( i >= matrix->Size ||
         j >= matrix->Size )
          Error(DimError, "IntegerSquareMatrix Dimension Error");

     return( (INT *) matrix->Matrix + i*matrix->Size + j );
};

/****** FullCopyIntSqrMat
     This routine copies the full contents of the structure
*/
void FullCopyIntSqrMat( IntegerSquareMatrix *matrix, IntegerSquareMatrix *pointer )
{
INT total,i;
INT *pntr1,*pntr2;

     total = matrix->Size * matrix->Size;
     pntr1 = pointer->Matrix;
     pntr2 = matrix->Matrix;
     COPYi( pntr1, pntr2, total);

};

/****** PrtIntSqrMat
*/
void PrtIntSqrMat( IntegerSquareMatrix *matrix)       
{
int i,j,*pntr;

     pntr = matrix->Matrix;
 
     LOOPi(matrix->Size)
          {
          printf(" %5d :",i);
          LOOPj(matrix->Size)
               printf(" %4d ",*pntr++);
          printf("\n");
          }
}

/****** ZeroIntSqrMat
*/
void ZeroIntSqrMat( IntegerSquareMatrix *matrix )
{
INT total,i;
INT *pntr;

     total = matrix->Size * matrix->Size;

     pntr = matrix->Matrix;
     LOOPi(total) *pntr++ = 0;
}




