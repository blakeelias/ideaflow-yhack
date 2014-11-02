def swap(a,b):
	tmp = a
	a = b
	b = tmp
	return a,b

def partition(A, l, h):
	p = A[l][1]
	i = l+1
	for j in range(l+1,h+1):
		if A[j][1] > p:
			A[i], A[j] = swap(A[j], A[i])
			i = i+1

	A[l], A[i-1]  = swap(A[l], A[i-1])
	return i-1

def quicksort(A, low, high):
	if low < high:
		pivot = partition(A, low, high)
		quicksort(A, low, pivot-1)
		quicksort(A, pivot+1, high)

def sortEnumeratedList(A):
	quicksort(A, 0, len(A)-1)
	return A