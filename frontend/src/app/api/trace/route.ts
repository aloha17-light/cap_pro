import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { code } = await req.json();

    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    // Phase 4: Mock Execution Trace
    // For now, regardless of the Python code inputted, we return a hardcoded 
    // execution trace of a simple algorithm (e.g. computing a factorial or sum).
    // Later, this endpoint will be connected to the actual Python sys.settrace engine.

    const mockTrace = [
      { step: 1, line: 1, locals: {} },
      { step: 2, line: 2, locals: { n: 5 } },
      { step: 3, line: 3, locals: { n: 5, result: 1 } },
      { step: 4, line: 5, locals: { n: 5, result: 1, i: 1 } },
      { step: 5, line: 6, locals: { n: 5, result: 1, i: 1 } },
      { step: 6, line: 5, locals: { n: 5, result: 1, i: 2 } },
      { step: 7, line: 6, locals: { n: 5, result: 2, i: 2 } },
      { step: 8, line: 5, locals: { n: 5, result: 2, i: 3 } },
      { step: 9, line: 6, locals: { n: 5, result: 6, i: 3 } },
      { step: 10, line: 5, locals: { n: 5, result: 6, i: 4 } },
      { step: 11, line: 6, locals: { n: 5, result: 24, i: 4 } },
      { step: 12, line: 5, locals: { n: 5, result: 24, i: 5 } },
      { step: 13, line: 6, locals: { n: 5, result: 120, i: 5 } },
      { step: 14, line: 5, locals: { n: 5, result: 120, i: 5 } }, // Loop exit
      { step: 15, line: 8, locals: { n: 5, result: 120, i: 5 } }  // Return
    ];

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    return NextResponse.json({
      success: true,
      data: {
        trace: mockTrace,
      }
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
