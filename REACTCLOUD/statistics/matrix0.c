#include "basic.h"

#include "matrix0.h"
#include <math.h>

#define MAXIMUM 1E+37
#define MINIMUM 1E-37

static FLOAT *matele(FLOAT *mat, INT n,INT i, INT j);
static FLOAT *matrixele(FLOAT *mat, INT n,INT i, INT j);
static FLOAT *vecele(FLOAT *v, INT n);
static void LUbksb(FLOAT *a, INT n, INT *index, FLOAT *b);
static void Arrange(FullMatrixFLT *matrix, FLOAT *eigen);

#include "stats/matrix.c"

extern FLOAT *NthFullMatrixFLTElement(FullMatrixFLT *matrix,
				      INT i, INT j)
     {
     FLOAT *ele;
     
     if( i > matrix->Dim1 ||
	j >= matrix->Dim2 )
	  {
	  Error(-1,"Illegal Element in Matrix");
	  ele = 0;
	  }
     ele = matrix->Elements + i*(matrix->Dim2) + j;
     
     return(ele);
     }         

extern FullMatrixFLT *NormalizeColumns(FullMatrixFLT *matrix)
     {
     FullMatrixFLT *norm;
     INT i,j;
     FLOAT *normflt,*flt,factor,*nrm,ave,var,temp;
     
     norm = AllocateFullMatrixFLT;
     CreateFullMatrixFLT(norm,matrix->ID,matrix->Name,
			 matrix->Dim1,
			 matrix->Dim2,
			 matrix->TotalDim,
			 0);
     
     norm->Elements = normflt =
	  AllocArrayFLOAT(matrix->TotalDim);
     LOOPi(matrix->Dim2)
	  {
	  flt = matrix->Elements + i;
	  ave = 0.0;
	  LOOPj(matrix->Dim1)
	       {
	       ave += *flt;
	       flt += matrix->Dim2;
	       }
	  ave = ave / ((FLOAT) matrix->Dim1);
	  
	  var = 0.0;
	  flt = matrix->Elements + i;
	  LOOPj(matrix->Dim1)
	       {
	       temp = *flt - ave;
	       flt += matrix->Dim2;
	       var += temp*temp;
	       }
	  /*      var = var / ((FLOAT) matrix->Dim1); */
	  var = sqrt((double) var);
	  
	  if(var == 0.0)
	       factor = 1.0;
	  else
	       factor = 1.0 / var;
	  
	  flt = matrix->Elements + i;
	  nrm = normflt + i;
	  
	  temp = 0.0;
	  LOOPj(matrix->Dim1)
	       {
	       *nrm = factor * (*flt - ave);
	       temp += (*nrm) * (*nrm);
	       nrm += matrix->Dim2;
	       flt += matrix->Dim2;
	       }
	  }
     
     return(norm);
     }

extern FullMatrixFLT *ReadInFullMatrixFLT(CommandReturn *comret,
					  FILE *file)
     {
     INT i,j,dim1,dim2,id;
     FLOAT *mat;
     CHAR *name,*number;
     FullMatrixFLT *matrix;
     
     comret->Rest = NextNonBlankLine(file,comret->Line);
     id = CommandIsolateInteger(comret,BLANK);
     name = CommandIsolateString(comret,BLANK);

     comret->Rest = NextNonBlankLine(file,comret->Line);
     dim1 = CommandIsolateInteger(comret,BLANK);
     dim2 = CommandIsolateInteger(comret,BLANK);
     
     matrix = AllocateFullMatrixFLT;
     CreateFullMatrixFLT(matrix,id,name,
                         dim1,dim2,dim1*dim2,0);
     Free(name);
     
     mat = matrix->Elements;
     LOOPi(matrix->Dim1)
          {
          comret->Rest = NextNonBlankLine(file,comret->Line);
          LOOPj(matrix->Dim2)
               {
               number = CommandIsolateString(comret,BLANK);
               *mat = ConvertStringToFloat(number);
               Free(number);
               mat++;
               }
          }
     return(matrix);
     }

extern FullMatrixFLT *MatrixTransposeFLOAT(FullMatrixFLT *mat)
     {
     INT i,j;
     FullMatrixFLT *trns;
     FLOAT *mate,*trnele;
     
     trns = AllocateFullMatrixFLT;
     CreateFullMatrixFLT(trns,mat->ID,mat->Name,
			 mat->Dim2,mat->Dim1,
			 (mat->Dim1)*(mat->Dim2),
			 0);
     mate = mat->Elements;
     LOOPi(mat->Dim1)
          {
          trnele = trns->Elements + i;
          LOOPj(mat->Dim2)
               {
               *trnele = *mate++;
               trnele += trns->Dim2;
               }
          }
     return(trns);
     }

static  CHAR formdefault[] = " %10f ";

extern void PrintFullMatrixFLOAT(FullMatrixFLT *mat,
				 CHAR *title, CHAR *form)
     {
     INT i,j;
     CHAR *form1;
     FLOAT *mat1;
     
     if(form == 0)
          form1 = formdefault;
     else
          form1 = form;
     
     printf("(%d,%d)----%s\n",mat->Dim1,mat->Dim2,title);
     mat1 = mat->Elements;
     LOOPi(mat->Dim1)
          {
          LOOPj(mat->Dim2)
               printf(form1,*mat1++);
          printf("\n");
          }
     printf("\n");
     }

extern FullMatrixFLT *MatrixMultFLT(INT id, CHAR *name,
				    FullMatrixFLT *mat1,
				    FullMatrixFLT *mat2)
     {
     FullMatrixFLT *ans;
     
     ans = AllocateFullMatrixFLT;
     CreateFullMatrixFLT(ans,id,name,
			 mat1->Dim1,
			 mat2->Dim2,
			 (mat1->Dim1)*(mat2->Dim2),
			 0);
     MatrixMult(mat1,mat2,ans);
     return(ans);
     }

extern FullMatrixFLT *ElementSquaredFLT(INT id, CHAR *name,
					FullMatrixFLT *mat1)
     {
     FullMatrixFLT *ans;
     FLOAT *a,*m1;
     INT i,total;
     
     total = (mat1->Dim1) * (mat1->Dim2);
     
     ans = AllocateFullMatrixFLT;
     CreateFullMatrixFLT(ans,id,name,
			 mat1->Dim1,
			 mat1->Dim2,
			 total,
			 0);
     
     
     a = ans->Elements;
     m1 = mat1->Elements;
     LOOPi(total)
	  {
	  *a++ = (*m1) * (*m1);
	  m1++;
	  }
     
     
     return(ans);
     }

extern FullMatrixFLT *MatrixSubtractFLT(INT id, CHAR *name,
					FullMatrixFLT *mat1,
					FullMatrixFLT *mat2)
     {
     FullMatrixFLT *ans;
     FLOAT *a,*m1,*m2;
     INT i,total;
     
     if( mat1->Dim1 != mat2->Dim1 ||
	mat1->Dim2 != mat2->Dim2 )
	  Error(-1,"Subtract: Array Mismatch");
     
     
     total = (mat1->Dim1) * (mat1->Dim2);
     
     ans = AllocateFullMatrixFLT;
     CreateFullMatrixFLT(ans,id,name,
			 mat1->Dim1,
			 mat1->Dim2,
			 total,
			 0);
     
     
     a = ans->Elements;
     m1 = mat1->Elements;
     m2 = mat2->Elements;
     LOOPi(total)
	  *a++ = *m1++ - *m2++;
     
     return(ans);
     }

extern void MatrixMult(FullMatrixFLT *mat1,
		       FullMatrixFLT *mat2,
		       FullMatrixFLT *ans)
     {
     FLOAT *mr1,*mc2,*mrtop,*mctop,*result;
     INT i,j,k;
     
     if( mat1->Dim2 != mat2->Dim1 ||
	mat1->Dim1 != ans->Dim1  ||
	mat2->Dim2 != ans->Dim2  )
          Error(-1,"Matrix Mismatch");
     
     result = ans->Elements;
     mrtop = mat1->Elements;
     LOOPi(mat1->Dim1)
          {
          mctop = mat2->Elements;
          LOOPj(mat2->Dim2)
	       {
	       mr1 = mrtop;
	       mc2 = mctop;
	       *result = 0.0;
	       LOOPk(mat1->Dim2)
		    {
		    *result += (*mc2) * (*mr1);
		    mc2 += mat2->Dim2;
		    mr1 += 1;
		    }
	       result++;
	       mctop++;
	       }
          mrtop += mat1->Dim2;
          }
     }

extern FullMatrixFLT *DiagonalFLTFromVector(INT id, CHAR *name,
					    FLOAT *vector, INT dimension)
     {
     FullMatrixFLT *diag;
     FLOAT *flt;
     INT i,dim2;
     
     dim2 = dimension*dimension;
     diag = AllocateFullMatrixFLT;
     CreateFullMatrixFLT(diag,id,name,
			 dimension,dimension,dimension*dimension,
			 0);
     
     flt = diag->Elements;
     LOOPi(dim2)
	  *flt = 0.0;
     
     flt = diag->Elements;
     LOOPi(dimension)
	  {
	  *flt = *vector++;
	  flt += dimension + 1;
	  }
     return(diag);
     }

extern FullMatrixFLT *MergeColumnsMatrixFLT(INT id, CHAR *name,
					    FullMatrixFLT *mat1,
					    FullMatrixFLT *mat2)
     {
     FullMatrixFLT *merge;
     INT i,j,dim1,dim2;
     FLOAT *m1,*m2,*a;
     
     if(mat1->Dim1 != mat2->Dim1)
	  Error(-1,"Matrix Merge Mismatch");
     
     dim1 = mat1->Dim1;
     dim2 = mat1->Dim2 + mat2->Dim2;
     
     merge = AllocateFullMatrixFLT;
     CreateFullMatrixFLT(merge,id,name,
			 dim1,dim2,dim1*dim2,0);
     
     a = merge->Elements;
     m1 = mat1->Elements;
     m2 = mat2->Elements;
     LOOPi(dim1)
	  {
	  LOOPj(mat1->Dim2)
	       *a++ = *m1++;
	  LOOPj(mat2->Dim2)
	       *a++ = *m2++;
	  }
     return(merge);
     }

	   
	       
extern SymmetricEigenMath *EigenMatrix(INT id, CHAR *name, FullMatrixFLT *elements)
     {
     SymmetricEigenMath *eigen;
     INT dimension,total;
     FullMatrixFLT *eigenvec;
     
     dimension = elements->Dim1;
     total = dimension*dimension;
     
     eigenvec = AllocateFullMatrixFLT;
     CreateFullMatrixFLT(eigenvec,id,name,
                         dimension,dimension,total,0);
     eigen = AllocateSymmetricEigenMath;
     CreateSymmetricEigenMath(eigen,
			      id,name,
			      dimension,
			      elements,
			      0,
			      eigenvec);
     
     ComputeEigenVector(eigen);
     Arrange(eigen->Eigenvectors,eigen->Eigenvalues);
     return(eigen);
     }

extern void ComputeEigenVector(SymmetricEigenMath *eigen)
     {
     INT nrot,dim,i;
     FLOAT *flts,*fltstart,*old;
     
     dim = eigen->NumberOfRows * eigen->NumberOfRows;
     flts = fltstart = AllocArrayFLOAT(dim);
     old = eigen->Elements->Elements;
     LOOPi(dim)
          *flts++ = *old++;
     
     jacobi(fltstart,
            eigen->NumberOfRows,
            eigen->Eigenvalues,
            eigen->Eigenvectors->Elements,
            &nrot);
     Free(fltstart);
     }

#define ROTATE(a,i,j,k,l) g = *(matele(a,n,i,j));\
h = *(matele(a,n,k,l));\
*(matele(a,n,i,j)) = g-s*(h+g*tau);\
*(matele(a,n,k,l)) = h+s*(g-h*tau);

static FLOAT *matele(FLOAT *mat, INT n,INT i, INT j)
     {
     FLOAT *ele;
     
     ele = mat + (i-1)*n + j-1;
     return(ele);
     }

static FLOAT *matrixele(FLOAT *mat, INT n,INT i, INT j)
     {
     FLOAT *ele;
     ele = mat + i*n + j;
     return(ele);
     }


static FLOAT *vecele(FLOAT *v, INT n)
     {
     return(v+n);
     }

extern FullMatrixFLT *MatrixInverseFLT(INT id, CHAR *name, FullMatrixFLT *orig)
     {
     INT dimension,total;
     FullMatrixFLT *elements,*new;
     
     
     dimension = orig->Dim1;
     if(dimension != orig->Dim2)
	  Error(-1,"Attempt to Invert Non-Square Matrix");
     
     total = dimension*dimension;
     
     elements = AllocateFullMatrixFLT;
     CopyFullFullMatrixFLT(elements,orig);
     
     new = AllocateFullMatrixFLT;
     CreateFullMatrixFLT(new,id,name,
                         dimension,dimension,total,0);
     
     ComputeInverse(elements,new);
     FreeFullMatrixFLT(elements);
     Free(elements);
     
     return(new);
     }

extern void ComputeInverse(FullMatrixFLT *element, FullMatrixFLT *new)
     {
     FLOAT *mat,*column,*colele,d;
     INT i,j,*index,dimension;
     
     dimension = element->Dim1;
     index = AllocArrayINT(dimension);
     
     
     LUcompute(element->Elements,
	       dimension,
	       index,
	       &d);
     
     mat = new->Elements;
     column = AllocArrayFLOAT(dimension);
     
     LOOPj(dimension) 
          {
	  colele = column;
	  LOOPi(dimension) *colele++ = 0.0;
	  
	  *(column + j) = 1.0;
	  LUbksb(element->Elements,dimension,index,column);
	  LOOPi(dimension)
	       *(matrixele(mat,dimension,i,j)) =
		    *(vecele(column,i));
	  
	  }
     }

#define TINY 1E-30
extern void LUcompute(FLOAT *a, INT n, INT*index, FLOAT *d) 
     {
     INT i,imax,j,k;
     FLOAT big,dum,sum,temp;
     FLOAT *vv;
     
     vv = AllocArrayFLOAT(n);
     *d = 1.0;
     LOOPi(n) 
	  {
	  big = 0.0;
	  LOOPj(n)
	       {
	       temp = *(matrixele(a,n,i,j));
	       temp = fabs((double) temp);
	       if( temp > big ) big = temp;
	       }
	  if(big == 0)
	       Error(-1,"Singular Matrix");
	  *(vecele(vv,i)) = 1.0 / big;
	  }
     
     LOOPj(n)
	  {
	  LOOPi(j)
	       {
	       sum = *(matrixele(a,n,i,j));
	       LOOPk(i)
		    {
		    sum -= *(matrixele(a,n,i,k)) *
			 *(matrixele(a,n,k,j));
		    }
	       *(matrixele(a,n,i,j)) = sum;
	       }
	  big = 0.0;
	  
	  imax = j;
	  for(i=j;i<n;i++)
	       {
	       sum = *(matrixele(a,n,i,j));
	       LOOPk(j)
		    {
		    sum -= *(matrixele(a,n,i,k)) *
			 *(matrixele(a,n,k,j));
		    }
	       *(matrixele(a,n,i,j)) = sum;
	       dum = *(vecele(vv,i)) * fabs((double) sum);
	       if(dum >= big)
		    {
		    big = dum;
		    imax = i;
		    }
	       }
	  if( j != imax ) 
	       {
	       LOOPk(n)
		    {
		    dum = *(matrixele(a,n,imax,k));
		    *(matrixele(a,n,imax,k)) =
			 *(matrixele(a,n,j,k));
		    *(matrixele(a,n,j,k)) = dum;
		    }
	       *d = -(*d);
	       *(vecele(vv,imax)) = *(vecele(vv,j));
	       }
	  *(index + j) = imax;
	  if(*(matrixele(a,n,j,j)) == 0)
	       *(matrixele(a,n,j,j)) = TINY;
	  if(j != n-1)
	       {
	       dum = 1.0 / (*(matrixele(a,n,j,j)));
	       for(i=j+1;i<n;i++)
		    *(matrixele(a,n,i,j)) *= dum;
	       }
	  }
     Free(vv);
     }

static void LUbksb(FLOAT *a, INT n, INT *index, FLOAT *b)
     {
     INT i,ip,j,ii;
     FLOAT sum;
     
     ii = -1;
     LOOPi(n)
	  {
	  ip = *(index + i);
	  sum = *(vecele(b,ip));
	  *(vecele(b,ip)) = *(vecele(b,i));
	  if(ii != -1)
	       for(j=ii;j<=i-1;j++)
		    {
		    sum -= *(matrixele(a,n,i,j)) *
			 *(vecele(b,j));
		    }
	  else if(sum != 0.0)
	       ii = i;
	  *(vecele(b,i)) = sum;
	  }
     for(i=n-1;i>=0;i--)
	  {
	  sum = *(vecele(b,i));
	  for(j=i+1;j<n;j++)
	       {
	       sum -= *(matrixele(a,n,i,j)) *
		    *(vecele(b,j));
	       }
	  *(vecele(b,i)) = sum / *(matrixele(a,n,i,i));
	  }
     }

#define VERYSMALL 1E-10

extern void jacobi(FLOAT *a, INT n,FLOAT *d,FLOAT *v,INT *nrot)
     {
     INT j,iq,ip,i;
     FLOAT tresh,theta,tau,t,sm,s,h,g,c,*b,*z;
     
     b=AllocArrayFLOAT(n);
     z=AllocArrayFLOAT(n);
     for (ip=1;ip<=n;ip++) {
     for (iq=1;iq<=n;iq++) *(matele(v,n,ip,iq)) = 0.0;
     *(matele(v,n,ip,ip)) = 1.0;
     }
     for (ip=1;ip<=n;ip++) {
     b[ip]=d[ip-1] = *(matele(a,n,ip,ip));
     z[ip]=0.0;
     }
     *nrot=0;
     for (i=1;i<=110;i++) {
     sm=0.0;
     for (ip=1;ip<=n-1;ip++) {
     for (iq=ip+1;iq<=n;iq++)
	  sm += fabs(*(matele(a,n,ip,iq)));
     }
     if (sm == 0.0) {
     Free(z);
     Free(b);
     return;
     }
     if (i < 4)
	  tresh=0.2*sm/(n*n);
     else
	  tresh=0.0;
     for (ip=1;ip<=n-1;ip++) {
     for (iq=ip+1;iq<=n;iq++) {
     g=100.0*fabs(*(matele(a,n,ip,iq)));
     if (i > 4                                     && 
	 fabs(d[ip-1])+g == fabs(d[ip-1])   &&
	 fabs(d[iq-1])+g == fabs(d[iq-1])  )
	  *(matele(a,n,ip,iq)) = 0.0;
     else if (fabs(*(matele(a,n,ip,iq))) > tresh) {
     h=d[iq-1]-d[ip-1];
     if (fabs(h)+g == fabs(h))
	  t=(*(matele(a,n,ip,iq)))/h;
     else {
     theta=0.5*h/(*(matele(a,n,ip,iq)));
     t=1.0/(fabs(theta)+sqrt(1.0+theta*theta));
     if (theta < 0.0) t = -t;
     }
     c=1.0/sqrt(1+t*t);
     s=t*c;
     tau=s/(1.0+c);
     h=t*(*(matele(a,n,ip,iq)));
     z[ip] -= h;
     z[iq] += h;
     d[ip-1] -= h;
     d[iq-1] += h;
     *(matele(a,n,ip,iq)) = 0.0;
     for (j=1;j<=ip-1;j++) {
     ROTATE(a,j,ip,j,iq)
     }
     for (j=ip+1;j<=iq-1;j++) {
     ROTATE(a,ip,j,j,iq)
     }
     for (j=iq+1;j<=n;j++) {
     ROTATE(a,ip,j,iq,j)
     }
     for (j=1;j<=n;j++) {
     ROTATE(v,j,ip,j,iq)
     }
     ++(*nrot);
     }
     }
     }
     for (ip=1;ip<=n;ip++) {
     b[ip] += z[ip];
			d[ip-1]=b[ip];
     z[ip]=0.0;
     }
     }
     Error(-1,"Too many iterations in routine JACOBI");
     }

#define COORD(i,j) mat + (i)*dim + (j)

static void Arrange(FullMatrixFLT *matrix, FLOAT *eigen)
     {
     INT dim,i,j,itop;
     FLOAT temp,top,*mat;
     
     dim = matrix->Dim1;
     mat = matrix->Elements;
     LOOPi(dim)
          {
          itop = i;
          top = *(eigen + i);
          for(j=i+1;j<dim;j++)
	       if( *(eigen + j) > top )
		    {
		    itop = j;
		    top = *(eigen + j);
		    }
          if( itop != i )
               {
               *(eigen + itop) = *(eigen + i);
               *(eigen + i) = top;
               LOOPj(dim)
                    {
                    temp = *(COORD(j,i));
                    *(COORD(j,i)) = *(COORD(j,itop));
                    *(COORD(j,itop)) = temp;
                    }
               }
          }
     }
#undef COORD
#undef ROTATE

