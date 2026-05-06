import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join('/');
  const searchParams = request.nextUrl.searchParams.toString();
  const url = `${API_BASE_URL}/api/auth/${path}${searchParams ? `?${searchParams}` : ''}`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...Object.fromEntries(
          request.headers.entries()
        )
      },
      credentials: 'include'
    });
    
    const data = await response.json();
    const res = NextResponse.json(data, { status: response.status });
    
    // 复制 CORS 头
    response.headers.forEach((value, key) => {
      if (key.toLowerCase().startsWith('access-control')) {
        res.headers.set(key, value);
      }
    });
    
    return res;
  } catch (error) {
    return NextResponse.json(
      { detail: '无法连接到后端服务' },
      { status: 503 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join('/');
  const body = await request.json();
  const url = `${API_BASE_URL}/api/auth/${path}`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...Object.fromEntries(
          request.headers.entries()
        )
      },
      body: JSON.stringify(body),
      credentials: 'include'
    });
    
    const data = await response.json();
    const res = NextResponse.json(data, { status: response.status });
    
    // 复制 CORS 头
    response.headers.forEach((value, key) => {
      if (key.toLowerCase().startsWith('access-control')) {
        res.headers.set(key, value);
      }
    });
    
    return res;
  } catch (error) {
    return NextResponse.json(
      { detail: '无法连接到后端服务' },
      { status: 503 }
    );
  }
}
