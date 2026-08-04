#if defined(__linux__)
#include <tirpc/rpc/types.h>
#include <tirpc/rpc/xdr.h>
#else
#include <rpc/types.h>
#include <rpc/xdr.h>
#endif
extern void xdr_INT(XDR *xdrs, char **i);
extern void xdr_NAME(XDR *xdrs, CHAR **name);
extern void xdr_FLOAT(XDR *xdrs, char **f);
